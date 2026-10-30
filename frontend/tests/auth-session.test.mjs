import assert from 'node:assert/strict';
import { loginSession, sessionUser } from '../src/utils/authSession.js';
globalThis.localStorage = { setItem() {}, removeItem() {} };
for (const status of [401, 403, 500]) {
  await assert.rejects(loginSession({ post: async () => { throw { response: { status, data: { message: 'Không đăng nhập được' } } }; } }, { email: 'admin', password: 'admin' }), /Không đăng nhập được/);
}
await assert.rejects(loginSession({ post: async () => { throw new Error('timeout'); } }, { email: 'admin', password: 'admin' }), /timeout/);
const user = { id: 1, role_id: 1 };
assert.equal((await loginSession({ post: async (_url, _data, options) => { assert.ok(options.withCredentials); assert.ok(options.timeout > 4000); return { data: { status: 'success', user } }; } }, {})).user.id, 1);
assert.equal(await sessionUser({ get: async () => { throw { response: { status: 401 } }; } }), null);
await assert.rejects(sessionUser({ get: async () => { throw new Error('offline'); } }));
console.log('PASS: login requires server success; timeout, 401, 403 and 500 never create a fake admin session.');
