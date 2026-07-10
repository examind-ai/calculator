# @examind/calculator-mui

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
