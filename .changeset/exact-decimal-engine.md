---
'@examind/calculator-core': major
'@examind/calculator-react': major
'@examind/calculator-mui': major
---

Exact decimal arithmetic. The engine computes with decimal.js at 40 significant digits and displays 15, so `0.1 + 0.2` is `0.3` by construction, integer products up to 30 digits are exact, and results carry full precision through `=`, unary, percent and negate (`1 / 3 = x 3 =` is `1`). Property-tested against an exact rational oracle, fuzzed for state-machine invariants, and pinned by a golden keystroke table.

Breaking: the `Evaluator` contract speaks `Value` strings (canonical decimals), never JS numbers, and gains `parse`, `percent` and `format`; `CalculatorState.operands` / `repeatOperand` are `Value`s and a `value` field carries the exact current result; `getExpression` takes the evaluator as an optional second argument. Core now has one runtime dependency, decimal.js. The demo no longer shows a custom-evaluator panel; the seam exists for modes, not as a public feature.
