# @examind/calculator-core

## 1.1.0

### Minor Changes

- 4c1976a: Thousands separators on both display lines (`123,456,789`), like the iPhone and Windows calculators. Core exports the pure `groupDigits` / `groupExpression` helpers; `useCalculator(evaluator, { grouping })` and the MUI `grouping` prop default to on. Presentation only: the engine's strings and `state` are never grouped.
- e1dc669: Paste a number into the calculator. `Evaluator.paste(text)` sanitises copied text (`1,234.50`, `$2,000`, `-3`, `1.5e-7`), rounds to the 15 significant digits the keypad allows, and rejects anything that is not one number; a new `paste` action puts the value in the register like a result. `useCalculator` exposes `handlePaste(event)`; the MUI skin listens for paste on its focusable root (`paste` prop, default true). Text that is not a number clears the register and shows `Invalid input` (as Windows Calculator does) rather than the sticky `Error`: a digit, point or new paste recovers, and other keys are inert until then so a stale value cannot be operated on by mistake.

## 1.0.0

### Major Changes

- 11158de: Exact decimal arithmetic. The engine computes with decimal.js at 40 significant digits and displays 15, so `0.1 + 0.2` is `0.3` by construction, integer products up to 30 digits are exact, and results carry full precision through `=`, unary, percent and negate (`1 / 3 = x 3 =` is `1`). Property-tested against an exact rational oracle, fuzzed for state-machine invariants, and pinned by a golden keystroke table.

  Breaking: the `Evaluator` contract speaks `Value` strings (canonical decimals), never JS numbers, and gains `parse`, `percent` and `format`; `CalculatorState.operands` / `repeatOperand` are `Value`s and a `value` field carries the exact current result; `getExpression` takes the evaluator as an optional second argument. Core now has one runtime dependency, decimal.js. The demo no longer shows a custom-evaluator panel; the seam exists for modes, not as a public feature.

## 0.2.4

### Patch Changes

- 63d7e6f: `digit()` now collapses a negative-zero entry (`-0`, reachable by backspacing a negated value) like a plain `0` while preserving the sign, so `-0` + `3` yields `-3` instead of the malformed `-03`.

## 0.2.3

### Patch Changes

- 4985006: `afterEquals` now clears the repeat operator/operand, so applying a unary / percent / negate to a result breaks the repeat chain. A following `=` is a stable no-op instead of replaying the pre-unary operation one press late.

## 0.2.2

### Patch Changes

- 6f3366a: Negate (`±`) is now a no-op while awaiting an operand after a binary operator, so `5 +` then `±` keeps the display at `5` instead of wrongly flashing `-5` (matches iPhone). Results are unchanged.

## 0.2.1

### Patch Changes

- 7bd3c7f: Fix `clearEntry` after `=`: it left the evaluated expression's operands and
  operators in place, violating the `operators.length === operands.length`
  input invariant and silently dropping the next operand (`7 + 8 = CE 2 =` gave
  `15` instead of `2`). CE after a result now clears the committed tokens first,
  starting a clean context.

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
