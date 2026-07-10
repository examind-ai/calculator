---
"@examind/calculator-mui": minor
---

`Calculator` now accepts an optional `evaluator` prop that is passed through to `useCalculator`, so the shipped MUI skin can drive a custom mode (financial / scientific / ...) without rebuilding the button grid. Omitting the prop keeps `basicEvaluator`. The `Evaluator` type is now re-exported from `@examind/calculator-mui` for typing a custom evaluator.
