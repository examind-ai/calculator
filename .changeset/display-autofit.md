---
'@examind/calculator-mui': patch
---

Fix the display clipping a long value when the previous value had the same length (e.g. two exponential results in a row): the auto-fit font size is now written to the DOM directly, not only through React state. The display also refits when the widget is resized.
