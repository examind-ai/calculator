---
'@examind/calculator-core': minor
'@examind/calculator-react': minor
'@examind/calculator-mui': minor
---

Thousands separators on both display lines (`123,456,789`), like the iPhone and Windows calculators. Core exports the pure `groupDigits` / `groupExpression` helpers; `useCalculator(evaluator, { grouping })` and the MUI `grouping` prop default to on. Presentation only: the engine's strings and `state` are never grouped.
