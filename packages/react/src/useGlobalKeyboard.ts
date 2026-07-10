import { useEffect } from 'react';

// The parts of a keydown event the global guard inspects. Kept minimal so the
// predicate is a pure function, unit-testable without a DOM.
export type GlobalKeyGuardEvent = Pick<
  KeyboardEvent,
  'ctrlKey' | 'metaKey' | 'altKey'
> & { target: EventTarget | null };

const EDITABLE_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

// True when the keydown originates from an editable element the calculator must
// not hijack: a form field or any contentEditable host. Unknown/null targets
// are treated as non-editable.
const isEditableTarget = (target: EventTarget | null): boolean => {
  const el = target as
    | (Partial<HTMLElement> & { tagName?: string })
    | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  return (
    typeof el.tagName === 'string' &&
    EDITABLE_TAGS.has(el.tagName.toUpperCase())
  );
};

// Whether the *global* window listener should let a keydown pass through
// untouched (i.e. NOT map it to a calculator action / preventDefault). We skip
// events carrying a browser/app shortcut modifier (Ctrl/Cmd/Alt) and events
// aimed at an editable element on the host page. This guard lives in the global
// layer only: a skin wiring `handleKey` to its own focused container still
// receives every key.
export const shouldIgnoreGlobalKey = (
  event: GlobalKeyGuardEvent,
): boolean => {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  return isEditableTarget(event.target);
};

// Opt-in convenience: attach a key handler to `window` so keyboard input works
// without focusing the widget. Off unless `enabled`, so a library consumer never
// gets a surprise global listener. Skins/apps decide whether to turn it on.
export const useGlobalKeyboard = (
  handleKey: (event: KeyboardEvent) => void,
  enabled = true,
): void => {
  useEffect(() => {
    if (!enabled) return;
    const listener = (event: KeyboardEvent) => {
      if (shouldIgnoreGlobalKey(event)) return;
      handleKey(event);
    };
    window.addEventListener('keydown', listener);
    return () =>
      window.removeEventListener('keydown', listener);
  }, [handleKey, enabled]);
};
