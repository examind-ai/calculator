---
"@examind/calculator-core": patch
---

Fix `clearEntry` after `=`: it left the evaluated expression's operands and
operators in place, violating the `operators.length === operands.length`
input invariant and silently dropping the next operand (`7 + 8 = CE 2 =` gave
`15` instead of `2`). CE after a result now clears the committed tokens first,
starting a clean context.
