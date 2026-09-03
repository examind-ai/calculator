---
'@examind/calculator-core': minor
'@examind/calculator-react': minor
'@examind/calculator-mui': minor
---

Paste a number into the calculator. `Evaluator.paste(text)` sanitises copied text (`1,234.50`, `$2,000`, `-3`, `1.5e-7`), rounds to the 15 significant digits the keypad allows, and rejects anything that is not one number; a new `paste` action puts the value in the register like a result. `useCalculator` exposes `handlePaste(event)`; the MUI skin listens for paste on its focusable root (`paste` prop, default true). Text that is not a number clears the register and shows `Invalid input` (as Windows Calculator does) rather than the sticky `Error`: a digit, point or new paste recovers, and other keys are inert until then so a stale value cannot be operated on by mistake.
