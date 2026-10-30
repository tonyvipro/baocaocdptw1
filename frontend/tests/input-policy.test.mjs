import assert from 'node:assert/strict';
import { inputError, installInputPolicy } from '../src/utils/inputPolicy.js';
import { installApiSessionGuard, STALE_EDIT_EVENT } from '../src/utils/apiSessionGuard.js';

assert.equal(inputError('ệ'.repeat(250)), '');
assert.match(inputError('ệ'.repeat(251)), /250/);
for (const email of ['ten@gmail.com', 'ten+demo@icloud.com', 'ten@congty.com.vn']) assert.equal(inputError(email, { email: true }), '');
for (const email of ['ten@', 'ten@icloud', 'ten@@gmail.com', '.ten@gmail.com', 'ten..test@gmail.com', 'ten@-bad.com']) assert.match(inputError(email, { email: true }), /Email/);
for (const phone of ['0901234567', '01234567890']) assert.equal(inputError(phone, { phone: true }), '');
for (const phone of ['090123456', '012345678901', '+84901234567', '090abc1234', '０９０１２３４５６７']) assert.match(inputError(phone, { phone: true }), /10–11/);
for (const code of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', "' OR 1=1 --", 'javascript:alert(1)', 'x; DROP TABLE users']) assert.match(inputError(code), /HTML/);
assert.equal(inputError("O'Connor & Nhà phố (Q.1)"), '');
assert.equal(inputError('<script>Password9', { password: true }), '');
assert.equal(inputError('admin', { email: true, login: true }), '');

// Small DOM harness exercises the delegated guard, including React's value tracker.
class Input {
  constructor(type, placeholder = '', value = '') { Object.assign(this, { tagName: 'INPUT', type, placeholder, dataset: {}, maxLength: -1, inputMode: '', _value: value }); }
  get value() { return this._value; }
  set value(value) { this._value = value; }
  setCustomValidity(message) { this.error = message; }
}
globalThis.HTMLInputElement = Input;
globalThis.HTMLTextAreaElement = Input;
globalThis.MutationObserver = class { observe() {} disconnect() {} };
const handlers = {};
const phone = new Input('tel', 'Số điện thoại');
const search = new Input('search');
const root = { querySelectorAll: () => [phone, search], addEventListener: (key, value) => { handlers[key] = value; }, removeEventListener: key => delete handlers[key] };
const remove = installInputPolicy(root);
assert.equal(phone.maxLength, 11);
assert.equal(search.maxLength, 250);
let trackerWrites = 0;
Object.defineProperty(phone, 'value', { get() { return this._value; }, set(value) { trackerWrites++; this._value = value; } });
phone._value = '09012abc34567890';
handlers.input({ target: phone });
assert.equal(phone.value, '09012345678');
assert.equal(trackerWrites, 0, 'sanitizing must not swallow React onChange');
assert.equal(phone.maxLength, 11, 'phone policy persists after inputMode becomes numeric');
search._value = 'ệ'.repeat(251);
handlers.input({ target: search });
assert.equal(search.value.length, 250);
search._value = '<script>alert(1)</script>';
handlers.input({ target: search });
assert.match(search.error, /HTML/);
let cancelled = false;
handlers.submit({ target: { querySelectorAll: () => [search], checkValidity: () => !search.error, reportValidity() {} }, preventDefault() { cancelled = true; }, stopImmediatePropagation() {} });
assert.equal(cancelled, true);
remove();

const target = new EventTarget();
target.location = { href: 'http://localhost:3001/', origin: 'http://localhost:3001' };
target.localStorage = { getItem: () => 'test-token' };
let calls = 0; let staleEvents = 0;
target.addEventListener(STALE_EDIT_EVENT, () => staleEvents++);
target.fetch = async (_input, options) => {
  calls++;
  assert.equal(options.headers.get('Authorization'), 'Bearer test-token');
  return new Response(JSON.stringify({ code: 'STALE_VERSION' }), { status: 409 });
};
const removeApiGuard = installApiSessionGuard(target);
await target.fetch('/api/users/1', { method: 'PUT', body: '{}' });
assert.equal(staleEvents, 1);
assert.equal((await target.fetch('/api/users/1', { method: 'PUT', body: '{}' })).status, 409);
assert.equal(calls, 1, 'stale form cannot retry a write before reloading');
removeApiGuard();
console.log('Input policy, React input propagation and stale edit locking: passed.');
