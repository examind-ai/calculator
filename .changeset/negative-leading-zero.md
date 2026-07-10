---
"@examind/calculator-core": patch
---

`digit()` now collapses a negative-zero entry (`-0`, reachable by backspacing a negated value) like a plain `0` while preserving the sign, so `-0` + `3` yields `-3` instead of the malformed `-03`.
