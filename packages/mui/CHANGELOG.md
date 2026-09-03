# @examind/calculator-mui

## 1.1.1

### Patch Changes

- 5a7c174: Fix the display clipping a long value when the previous value had the same length (e.g. two exponential results in a row): the auto-fit font size is now written to the DOM directly, not only through React state. The display also refits when the widget is resized.
  - @examind/calculator-react@1.1.1

## 1.1.0

### Minor Changes

- 4c1976a: Thousands separators on both display lines (`123,456,789`), like the iPhone and Windows calculators. Core exports the pure `groupDigits` / `groupExpression` helpers; `useCalculator(evaluator, { grouping })` and the MUI `grouping` prop default to on. Presentation only: the engine's strings and `state` are never grouped.
- e1dc669: Paste a number into the calculator. `Evaluator.paste(text)` sanitises copied text (`1,234.50`, `$2,000`, `-3`, `1.5e-7`), rounds to the 15 significant digits the keypad allows, and rejects anything that is not one number; a new `paste` action puts the value in the register like a result. `useCalculator` exposes `handlePaste(event)`; the MUI skin listens for paste on its focusable root (`paste` prop, default true). Text that is not a number clears the register and shows `Invalid input` (as Windows Calculator does) rather than the sticky `Error`: a digit, point or new paste recovers, and other keys are inert until then so a stale value cannot be operated on by mistake.

### Patch Changes

- Updated dependencies [4c1976a]
- Updated dependencies [e1dc669]
  - @examind/calculator-react@1.1.0

## 1.0.0

### Major Changes

- 11158de: Exact decimal arithmetic. The engine computes with decimal.js at 40 significant digits and displays 15, so `0.1 + 0.2` is `0.3` by construction, integer products up to 30 digits are exact, and results carry full precision through `=`, unary, percent and negate (`1 / 3 = x 3 =` is `1`). Property-tested against an exact rational oracle, fuzzed for state-machine invariants, and pinned by a golden keystroke table.

  Breaking: the `Evaluator` contract speaks `Value` strings (canonical decimals), never JS numbers, and gains `parse`, `percent` and `format`; `CalculatorState.operands` / `repeatOperand` are `Value`s and a `value` field carries the exact current result; `getExpression` takes the evaluator as an optional second argument. Core now has one runtime dependency, decimal.js. The demo no longer shows a custom-evaluator panel; the seam exists for modes, not as a public feature.

### Patch Changes

- Updated dependencies [11158de]
  - @examind/calculator-react@1.0.0

## 0.5.0

### Minor Changes

- 8b13ad8: The MUI skin no longer renders a surface of its own. Its root was a
  `Paper elevation={3}` that also fixed `width: 320`, `p: 2`, `borderRadius: 2`
  and `bgcolor: 'background.default'`; it is now a plain `Box` that accepts `sx`
  and `className`.

  Elevation, background and width are statements about where the calculator sits,
  which only the host knows - so asserting them is the same mistake as hardcoding
  a color, the rule the skin contract already sets. Embedding the old widget in a
  raised panel produced two nested shadows and, because `background.default` is
  the page token rather than the surface token, a visible tonal patch where the
  widget met its container.

  BREAKING CHANGE: the widget now has no width, padding, background, radius or
  shadow. Supply the surface yourself to keep the previous appearance. `width`
  sizes the key grid, so a wrapper's padding sits outside it - 288 plus `p: 2`
  gives the same 320-wide card as before:

  ```tsx
  <Paper
    elevation={3}
    sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
  >
    <Calculator sx={{ width: 288, maxWidth: '100%' }} />
  </Paper>
  ```

## 0.4.0

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

### Patch Changes

- Updated dependencies [f714c33]
  - @examind/calculator-react@0.3.0

## 0.3.1

### Patch Changes

- Updated dependencies [b6c70c2]
  - @examind/calculator-react@0.2.0

## 0.3.0

### Minor Changes

- 39aab64: `Calculator` now accepts an optional `evaluator` prop that is passed through to `useCalculator`, so the shipped MUI skin can drive a custom mode (financial / scientific / ...) without rebuilding the button grid. Omitting the prop keeps `basicEvaluator`. The `Evaluator` type is now re-exported from `@examind/calculator-mui` for typing a custom evaluator.

### Patch Changes

- 5326edb: Build both packages with a `"use client"` banner (via tsup's `banner` option) so their `dist` entry files are marked as client modules. Imported from a Next.js App Router server component, they now establish a client boundary instead of failing with a confusing hooks-in-server-component error. Core is unchanged (no React, no directive).
- Updated dependencies [5326edb]
  - @examind/calculator-react@0.1.3

## 0.2.0

### Minor Changes

- 6f42898: Long and scientific-notation values are always fully readable in the display -
  never clipped or ellipsized.

  - core: cap typed entries at ~15 significant digits (further digits are noise a
    JS double cannot represent), and format computed results to ~12 significant
    figures using exponential notation for magnitudes outside `[1e-6, 1e12]` so a
    result is never a 20+ digit fixed string.
  - mui: auto-shrink the display font toward a readable floor so the full value
    fits its box; short values keep the base font.

### Patch Changes

- @examind/calculator-react@0.1.1
