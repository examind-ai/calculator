---
"@examind/calculator-core": patch
---
Negate (`±`) is now a no-op while awaiting an operand after a binary operator, so `5 +` then `±` keeps the display at `5` instead of wrongly flashing `-5` (matches iPhone). Results are unchanged.
