---
'@examind/calculator-core': patch
---

`1 / 3 = x 3 = - 1 =` and `2 sqrt x^2 - 2 =` now display `0` instead of `-1e-40` / `1e-39`. Addition and subtraction treat a result below 10^-35 of the larger operand as rounding residue in the 40-digit guard band and return 0; every genuine difference between 15-digit entries is at least 10^-15 relative and is untouched.
