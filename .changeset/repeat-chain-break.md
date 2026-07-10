---
"@examind/calculator-core": patch
---

`afterEquals` now clears the repeat operator/operand, so applying a unary / percent / negate to a result breaks the repeat chain. A following `=` is a stable no-op instead of replaying the pre-unary operation one press late.
