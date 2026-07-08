# @examind/calculator-core

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
