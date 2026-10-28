import assert from 'node:assert/strict';
import { installNumericInputGuard } from '../src/utils/numericInputGuard.js';

// Exercise native event sequences without a browser or a real Windows IME.
function fixture(type, inputMode = '', name = '') {
  const root = new EventTarget();
  const input = {
    tagName: 'INPUT', type, inputMode, name, value: '0901234567',
    selectionStart: type === 'number' ? null : 10,
    selectionEnd: type === 'number' ? null : 10,
    setSelectionRange(start, end) { this.selectionStart = start; this.selectionEnd = end; },
  };
  let changes = 0;
  const cleanup = installNumericInputGuard(root);
  root.addEventListener('input', () => { changes++; });
  const emit = (type, properties = {}) => {
    const event = new Event(type, { cancelable: type !== 'input' });
    for (const [key, value] of Object.entries({ target: input, ...properties })) {
      Object.defineProperty(event, key, { value });
    }
    root.dispatchEvent(event);
    return event;
  };
  emit('focusin');
  return { input, emit, cleanup, changes: () => changes };
}

for (const [type, mode] of [['number', ''], ['tel', ''], ['text', 'numeric'], ['text', 'decimal']]) {
  for (const letter of ['e', 'd', 'E', 'D']) {
    const { input, emit, changes } = fixture(type, mode);
    input.selectionStart = type === 'number' ? null : 0;
    assert.equal(emit('keydown', { key: letter, code: `Key${letter.toUpperCase()}` }).defaultPrevented, true);
    assert.equal(emit('beforeinput', { inputType: 'deleteContentBackward' }).defaultPrevented, true);
    input.value = '';
    emit('input', { inputType: 'deleteContentBackward' });
    assert.equal(input.value, '0901234567', `${type}/${mode}: ${letter} must not delete selected content`);
    assert.equal(changes(), 0, 'React must not receive the unwanted deletion');

    emit('keyup', { key: letter });
    assert.equal(emit('keydown', { key: 'Backspace', code: 'Backspace' }).defaultPrevented, false);
    assert.equal(emit('beforeinput', { inputType: 'deleteContentBackward' }).defaultPrevented, false);
    input.value = '090123456';
    emit('input', { inputType: 'deleteContentBackward' });
    assert.equal(input.value, '090123456');
    assert.equal(changes(), 1, 'Physical Backspace still reaches React');
  }

  const { input, emit } = fixture(type, mode);
  emit('compositionstart');
  assert.equal(emit('beforeinput', { inputType: 'deleteContentBackward', isComposing: true }).defaultPrevented, true);
  input.value = '090123456';
  emit('input', { inputType: 'deleteContentBackward', isComposing: true });
  emit('compositionend');
  assert.equal(input.value, '0901234567', 'IME deletion before the letter keydown is rolled back');
  assert.equal(emit('keydown', { key: 'Backspace', code: '', isComposing: true }).defaultPrevented, true);
  emit('keydown', { key: '8', code: 'Digit8' });
  input.value = '09012345678';
  emit('input', { inputType: 'insertText', data: '8' });
  assert.equal(input.value, '09012345678', 'Digits can still be inserted after a blocked composition');
  emit('cut');
  assert.equal(emit('beforeinput', { inputType: 'deleteByCut' }).defaultPrevented, false);
  input.value = '';
  emit('input', { inputType: 'deleteByCut' });
  assert.equal(input.value, '');

  const mobile = fixture(type, mode);
  assert.equal(mobile.emit('beforeinput', { inputType: 'deleteContentBackward' }).defaultPrevented, false,
    'A normal mobile keyboard deletion without keydown is allowed');
  mobile.input.value = '090123456';
  mobile.emit('input', { inputType: 'deleteContentBackward' });
  assert.equal(mobile.changes(), 1);

  emit('keydown', { key: 'e', code: 'KeyE' });
  emit('paste');
  input.value = '0123456789';
  emit('input', { inputType: 'insertFromPaste' });
  assert.equal(input.value, '0123456789', 'Paste still works after a rejected letter');

  const virtualKeyboard = fixture(type, mode);
  assert.equal(virtualKeyboard.emit('beforeinput', { inputType: 'insertText', data: 'e' }).defaultPrevented, true);
  virtualKeyboard.input.value = '';
  virtualKeyboard.emit('input', { inputType: 'insertText', data: 'e' });
  assert.equal(virtualKeyboard.input.value, '0901234567', 'Letter input without keydown must not clear a numeric value');
}

for (const name of ['phone', 'owner_phone', 'customer_phone']) {
  const { emit } = fixture('text', '', name);
  assert.equal(emit('keydown', { key: 'd' }).defaultPrevented, true, 'Text inputs used for phone numbers are covered');
}

for (const type of ['text', 'email', 'password', 'search']) {
  const { input, emit } = fixture(type);
  for (const key of ['e', 'd']) assert.equal(emit('keydown', { key }).defaultPrevented, false);
  emit('compositionstart');
  assert.equal(emit('beforeinput', { inputType: 'insertCompositionText', isComposing: true }).defaultPrevented, false);
  input.value = 'Tiếng Việt đ';
  emit('compositionend');
  assert.equal(input.value, 'Tiếng Việt đ', 'Text fields keep normal Vietnamese composition');
}

const { emit, cleanup } = fixture('tel');
cleanup();
assert.equal(emit('keydown', { key: 'e' }).defaultPrevented, false, 'Cleanup removes the guard');
console.log('PASS: e/d, selection replacement, IME deletion, real Backspace, digits, cut and Vietnamese text.');
