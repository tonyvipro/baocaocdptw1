export const TEXT_LIMIT = 250;
export const PHONE_PATTERN = /^[0-9]{10,11}$/;
export const EMAIL_PATTERN = /^[^\s@]+@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/i;
export const CODE_PATTERN = /<\s*\/?\s*[a-z][^>]*>|<\?(?:php|=)|\b(?:javascript|vbscript)\s*:|\bon\w+\s*=|\bunion\s+(?:all\s+)?select\b|['"]\s*(?:or|and)\s+['"\d]+\s*=|;\s*(?:drop|truncate|delete|insert|update)\s+(?:table|from|into|\w+\s+set)\b/iu;

export function inputError(value, { phone = false, email = false, password = false, login = false } = {}) {
  if (!value) return '';
  if ([...value].length > TEXT_LIMIT) return 'Thông tin không được vượt quá 250 ký tự.';
  if (phone && !PHONE_PATTERN.test(value)) return 'Số điện thoại phải có 10–11 chữ số.';
  if (email && !(login && ['admin', 'administrator'].includes(value))
    && (!EMAIL_PATTERN.test(value) || /(^\.|\.\.|\.@)/.test(value))) return 'Email không đúng định dạng (ví dụ ten@gmail.com, ten@icloud.com).';
  if (!password && CODE_PATTERN.test(value)) return 'Chỉ nhập văn bản, không nhập HTML, script hoặc câu lệnh can thiệp dữ liệu.';
  return '';
}

export function installInputPolicy(root) {
  const editable = el => el?.tagName === 'TEXTAREA' || (el?.tagName === 'INPUT'
    && ['text', 'search', 'email', 'tel', 'url', 'password', 'number'].includes(el.type));
  const settings = el => {
    const identity = `${el.name || ''} ${el.id || ''} ${el.autocomplete || ''} ${el.placeholder || ''}`;
    const phone = el.dataset.inputPhone === 'true' || /phone|mobile|điện thoại|10\s*[–-]\s*11|0901234567|sđt/i.test(identity)
      || (el.type === 'tel' && !['decimal', 'numeric'].includes(el.inputMode));
    return { phone, email: el.type === 'email' || /(?:^|_)email\b/i.test(el.name || ''),
      password: el.type === 'password' || /password|mật khẩu/i.test(identity), login: /email.*(?:tài khoản|đăng nhập)|username/i.test(identity) };
  };
  const configure = el => {
    if (!editable(el)) return;
    const policy = settings(el);
    const max = policy.phone ? 11 : TEXT_LIMIT;
    if (el.maxLength < 0 || el.maxLength > max) el.maxLength = max;
    if (policy.phone) { el.dataset.inputPhone = 'true'; el.inputMode = 'numeric'; el.pattern = '[0-9]{10,11}'; }
    el.setCustomValidity(inputError(el.value, policy));
  };
  const configureTree = node => {
    configure(node);
    node.querySelectorAll?.('input,textarea').forEach(configure);
  };
  const onInput = event => {
    const el = event.target;
    if (!editable(el)) return;
    const { phone } = settings(el);
    // Capture before React's onChange so controlled state receives the same value.
    const value = phone ? el.value.replace(/[^0-9]/g, '').slice(0, 11)
      : event.isComposing ? el.value : [...el.value].slice(0, Math.min(el.maxLength < 0 ? TEXT_LIMIT : el.maxLength, TEXT_LIMIT)).join('');
    if (value !== el.value) {
      // Use the native setter so React's value tracker still observes the change.
      const prototype = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototype, 'value').set.call(el, value);
    }
    configure(el);
  };
  const onSubmit = event => {
    configureTree(event.target);
    if (event.target.checkValidity && !event.target.checkValidity()) {
      event.preventDefault(); event.stopImmediatePropagation(); event.target.reportValidity();
    }
  };
  configureTree(root);
  const observer = new MutationObserver(changes => changes.forEach(change => change.addedNodes.forEach(configureTree)));
  observer.observe(root, { childList: true, subtree: true });
  root.addEventListener('input', onInput, true);
  root.addEventListener('focusin', eventConfigure, true);
  root.addEventListener('submit', onSubmit, true);
  function eventConfigure(event) { configure(event.target); }
  return () => {
    observer.disconnect(); root.removeEventListener('input', onInput, true);
    root.removeEventListener('focusin', eventConfigure, true); root.removeEventListener('submit', onSubmit, true);
  };
}
