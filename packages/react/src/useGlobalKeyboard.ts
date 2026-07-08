import { useEffect } from 'react';

// Opt-in convenience: attach a key handler to `window` so keyboard input works
// without focusing the widget. Off unless `enabled`, so a library consumer never
// gets a surprise global listener. Skins/apps decide whether to turn it on.
export const useGlobalKeyboard = (
  handleKey: (event: KeyboardEvent) => void,
  enabled = true,
): void => {
  useEffect(() => {
    if (!enabled) return;
    window.addEventListener('keydown', handleKey);
    return () =>
      window.removeEventListener('keydown', handleKey);
  }, [handleKey, enabled]);
};
