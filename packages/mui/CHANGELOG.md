# @examind/calculator-mui

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
