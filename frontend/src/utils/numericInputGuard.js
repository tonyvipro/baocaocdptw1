// Vietnamese IMEs can emit a deletion while trying to compose a letter in a
// numeric field. Stop that edit before React accepts the shortened value.
export function installNumericInputGuard(root) {
  const states = new WeakMap();
  const listeners = [];
  const isNumeric = input => input?.tagName === 'INPUT'
    && (['number', 'tel'].includes(input.type) || ['numeric', 'decimal'].includes(input.inputMode)
      || /(^|_)phone$/.test(input.name || ''));
  const remember = (input, state) => {
    state.value = input.value;
    state.start = input.selectionStart;
    state.end = input.selectionEnd;
  };
  const restore = (input, state) => {
    input.value = state.value;
    if (state.start !== null && state.start !== undefined) {
      input.setSelectionRange(state.start, state.end);
    }
  };
  const listen = (type, handler) => {
    const listener = event => {
      const input = event.target;
      if (!isNumeric(input)) return;
      if (!states.has(input)) {
        const state = { composing: false, blockedLetter: false, deleting: false };
        remember(input, state);
        states.set(input, state);
      }
      handler(event, input, states.get(input));
    };
    root.addEventListener(type, listener, { capture: true });
    listeners.push([type, listener]);
  };

  listen('focusin', (event, input, state) => {
    state.composing = state.blockedLetter = state.deleting = false;
    remember(input, state);
  });
  listen('keydown', (event, input, state) => {
    if (!state.composing) remember(input, state);
    state.deleting = false;
    if (event.ctrlKey || event.metaKey || event.altKey) {
      state.blockedLetter = false;
      return;
    }
    if (event.key?.length === 1 && /\p{L}/u.test(event.key)) {
      state.blockedLetter = true;
      event.preventDefault();
    } else if (['Backspace', 'Delete'].includes(event.key)) {
      // IMEs may synthesize Backspace without a physical key code.
      if ((state.composing || state.blockedLetter) && event.code !== event.key) {
        event.preventDefault();
      } else {
        state.blockedLetter = false;
        state.deleting = true;
      }
    } else if (event.key?.length === 1) {
      state.blockedLetter = false;
    }
  });
  listen('keyup', (event, input, state) => { state.deleting = false; });
  listen('compositionstart', (event, input, state) => {
    remember(input, state);
    state.composing = true;
    state.blockedLetter = true;
    state.deleting = false;
  });
  listen('compositionend', (event, input, state) => {
    restore(input, state);
    state.composing = false;
  });
  for (const type of ['paste', 'drop', 'cut']) {
    listen(type, (event, input, state) => {
      remember(input, state);
      state.composing = state.blockedLetter = false;
      state.deleting = type === 'cut';
    });
  }
  const unwantedEdit = (event, state) => state.composing || event.isComposing
    || (event.inputType === 'insertText' && /\p{L}/u.test(event.data || ''))
    || (event.inputType?.startsWith('delete') && state.blockedLetter && !state.deleting);
  listen('beforeinput', (event, input, state) => {
    if (unwantedEdit(event, state)) {
      state.blockedLetter = true;
      event.preventDefault();
    }
    else remember(input, state);
  });
  listen('input', (event, input, state) => {
    if (unwantedEdit(event, state)) {
      state.blockedLetter = true;
      restore(input, state);
      event.stopImmediatePropagation();
    } else {
      remember(input, state);
    }
  });

  return () => {
    for (const [type, listener] of listeners) root.removeEventListener(type, listener, { capture: true });
  };
}
