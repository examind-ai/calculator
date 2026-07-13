---
'@examind/calculator-mui': minor
'@examind/calculator-react': minor
---

Scope keyboard input to focus; remove the global window listener.

Keyboard handling is now focus-scoped: the calculator responds to keys only
while focus is within the widget, so an embedded calculator never swallows
keystrokes meant for the surrounding page (or another calculator).

Breaking changes:

- `@examind/calculator-mui`: the `globalKeyboard` prop is replaced by
  `keyboard` (default `true`). The always-on page-level listener is gone.
  Migration: `globalKeyboard={false}` -> `keyboard={false}`. There is no
  replacement for the old global behavior; a standalone full-page consumer
  should focus the now-focusable calculator root itself.
- `@examind/calculator-react`: the `useGlobalKeyboard` and
  `shouldIgnoreGlobalKey` functions and the `GlobalKeyGuardEvent` type are
  removed. Wire `handleKey` from `useCalculator()` to your focused container's
  `onKeyDown` instead.
