export const numericDraft = value => /^\d*(?:\.\d{0,2})?$/.test(value);
export const digitLimitMessage = 'Mức giá bạn muốn bán đã nhiều hơn tài sản của tỉ phú Elon Musk';
const digitCount = value => (String(value).match(/\d/g) || []).length;

export function validatePropertyForm(data) {
  for (const [field, label, max, positive] of [['price', 'Mức giá', 9999999999999, false], ['area', 'Diện tích', 100000000, true]]) {
    const value = String(data[field] ?? '');
    if (digitCount(value) > 20) return digitLimitMessage;
    if (!/^\d+(?:\.\d{1,2})?$/.test(value)) return `${label} chỉ được nhập số thông thường, tối đa 2 chữ số thập phân; không dùng chữ e, dấu + hoặc dấu -.`;
    const number = Number(value);
    if (!Number.isFinite(number) || number > max || (positive ? number <= 0 : number < 0)) return `${label} phải ${positive ? 'lớn hơn 0' : 'từ 0'} và không vượt quá ${max.toLocaleString('vi-VN')}.`;
  }
  if (String(data.address ?? '').length > 255) return 'Địa chỉ chi tiết không được vượt quá 255 ký tự.';
  return '';
}

export function numericInputProps(name, value, update, showError) {
  const restore = event => {
    event.target.value = String(value ?? '');
    showError('Chỉ nhập chữ số và dấu chấm thập phân, tối đa 2 chữ số sau dấu chấm.');
  };
  return {
    type: 'tel', inputMode: 'decimal', autoComplete: 'off', spellCheck: false,
    ref: input => {
      if (!input || input.__numericBeforeInput) return;
      input.__numericBeforeInput = true;
      input.addEventListener('beforeinput', event => {
        if (!event.isComposing && event.data && /^[0-9.]+$/.test(event.data)) input.__blockedLetter = false;
        if (event.inputType?.startsWith('delete') && !input.__deleteIntent) event.preventDefault();
        if (event.isComposing || input.__letterDown) event.preventDefault();
        if (event.data && !/^[0-9.]+$/.test(event.data)) event.preventDefault();
      });
      // Some IMEs bypass cancellable beforeinput. Restore the last accepted
      // value before React can commit an unsolicited numeric deletion.
      input.addEventListener('input', event => {
        if (event.inputType?.startsWith('delete') && !input.__deleteIntent) {
          input.value = input.__acceptedNumber ?? '';
          event.stopImmediatePropagation();
        }
      });
    },
    name, value, 'aria-label': name === 'price' ? 'Mức giá' : 'Diện tích',
    onKeyDown: event => {
      const input = event.currentTarget;
      input.__acceptedNumber = String(value ?? '');
      input.__deleteIntent = false;
      if (!event.ctrlKey && !event.metaKey && !event.altKey && event.key.length === 1 && !/[0-9.]/.test(event.key)) {
        input.__blockedLetter = true;
        input.__letterDown = true;
        event.preventDefault();
        event.stopPropagation();
      } else if (['Backspace', 'Delete'].includes(event.key) && (input.__letterDown || event.nativeEvent?.isComposing || !event.code)) {
        event.preventDefault();
      } else if (event.key.length === 1 || ['Backspace', 'Delete'].includes(event.key) || event.ctrlKey || event.metaKey) {
        input.__blockedLetter = false;
        input.__deleteIntent = ['Backspace', 'Delete'].includes(event.key);
      }
    },
    onKeyUp: event => { event.currentTarget.__letterDown = false; event.currentTarget.__deleteIntent = false; },
    onCut: event => { event.currentTarget.__deleteIntent = true; event.currentTarget.__acceptedNumber = String(value ?? ''); },
    onFocus: event => { event.currentTarget.__acceptedNumber = String(value ?? ''); },
    onPaste: event => {
      const input = event.currentTarget;
      input.__blockedLetter = false;
      input.__acceptedNumber = String(value ?? '');
      const text = event.clipboardData.getData('text');
      const next = input.value.slice(0, input.selectionStart) + text + input.value.slice(input.selectionEnd);
      if (digitCount(next) > 20) { event.preventDefault(); showError(digitLimitMessage); }
      else if (!numericDraft(next)) { event.preventDefault(); showError('Nội dung dán phải là số, tối đa 2 chữ số thập phân.'); }
    },
    onCompositionEnd: event => {
      if (event.target.__blockedLetter) event.target.value = String(value ?? '');
      else if (digitCount(event.target.value) > 20) { event.target.value = String(value ?? ''); showError(digitLimitMessage); }
      else if (numericDraft(event.target.value)) update(event);
      else restore(event);
    },
    onChange: event => {
      if (event.target.__blockedLetter) { event.target.value = String(value ?? ''); return; }
      if (event.nativeEvent?.isComposing) return;
      if (digitCount(event.target.value) > 20) { event.target.value = String(value ?? ''); showError(digitLimitMessage); return; }
      if (numericDraft(event.target.value)) { event.target.__acceptedNumber = event.target.value; showError(''); update(event); }
      else restore(event);
    },
  };
}
