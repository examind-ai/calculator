# @examind/calculator-react

## 0.3.0

### Minor Changes

- f714c33: Scope keyboard input to focus; remove the global window listener.

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

## 0.2.0

### Minor Changes

- b6c70c2: `keyToAction` now maps the physical `Delete` key to `{ type: 'clearEntry' }`, matching the Windows "Standard" layout the MUI skin follows (Delete = CE / clear entry, distinct from Escape's clear-all). Any skin wiring `handleKey` - including the shipped MUI `Calculator` - now honors Delete without changes.

### Patch Changes

- Updated dependencies [4985006]
  - @examind/calculator-core@0.2.3

## 0.1.3

### Patch Changes

- 5326edb: Build both packages with a `"use client"` banner (via tsup's `banner` option) so their `dist` entry files are marked as client modules. Imported from a Next.js App Router server component, they now establish a client boundary instead of failing with a confusing hooks-in-server-component error. Core is unchanged (no React, no directive).

## 0.1.2

### Patch Changes

- 7ae00e2: Global keyboard listener no longer hijacks typing in host-page editable elements (input / textarea / select / contentEditable) or swallows Ctrl/Cmd/Alt shortcuts.

## 0.1.1

### Patch Changes

- Updated dependencies [6f42898]
  - @examind/calculator-core@0.2.0
