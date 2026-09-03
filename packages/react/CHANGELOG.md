# @examind/calculator-react

## 1.1.1

### Patch Changes

- @examind/calculator-core@1.1.1

## 1.1.0

### Minor Changes

- 4c1976a: Thousands separators on both display lines (`123,456,789`), like the iPhone and Windows calculators. Core exports the pure `groupDigits` / `groupExpression` helpers; `useCalculator(evaluator, { grouping })` and the MUI `grouping` prop default to on. Presentation only: the engine's strings and `state` are never grouped.
- e1dc669: Paste a number into the calculator. `Evaluator.paste(text)` sanitises copied text (`1,234.50`, `$2,000`, `-3`, `1.5e-7`), rounds to the 15 significant digits the keypad allows, and rejects anything that is not one number; a new `paste` action puts the value in the register like a result. `useCalculator` exposes `handlePaste(event)`; the MUI skin listens for paste on its focusable root (`paste` prop, default true). Text that is not a number clears the register and shows `Invalid input` (as Windows Calculator does) rather than the sticky `Error`: a digit, point or new paste recovers, and other keys are inert until then so a stale value cannot be operated on by mistake.

### Patch Changes

- Updated dependencies [4c1976a]
- Updated dependencies [e1dc669]
  - @examind/calculator-core@1.1.0

## 1.0.0

### Major Changes

- 11158de: Exact decimal arithmetic. The engine computes with decimal.js at 40 significant digits and displays 15, so `0.1 + 0.2` is `0.3` by construction, integer products up to 30 digits are exact, and results carry full precision through `=`, unary, percent and negate (`1 / 3 = x 3 =` is `1`). Property-tested against an exact rational oracle, fuzzed for state-machine invariants, and pinned by a golden keystroke table.

  Breaking: the `Evaluator` contract speaks `Value` strings (canonical decimals), never JS numbers, and gains `parse`, `percent` and `format`; `CalculatorState.operands` / `repeatOperand` are `Value`s and a `value` field carries the exact current result; `getExpression` takes the evaluator as an optional second argument. Core now has one runtime dependency, decimal.js. The demo no longer shows a custom-evaluator panel; the seam exists for modes, not as a public feature.

### Patch Changes

- Updated dependencies [11158de]
  - @examind/calculator-core@1.0.0

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
