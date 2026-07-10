---
"@examind/calculator-react": minor
---

`keyToAction` now maps the physical `Delete` key to `{ type: 'clearEntry' }`, matching the Windows "Standard" layout the MUI skin follows (Delete = CE / clear entry, distinct from Escape's clear-all). Any skin wiring `handleKey` - including the shipped MUI `Calculator` - now honors Delete without changes.
