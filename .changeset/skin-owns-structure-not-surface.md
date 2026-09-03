---
'@examind/calculator-mui': minor
---

The MUI skin no longer renders a surface of its own. Its root was a
`Paper elevation={3}` that also fixed `width: 320`, `p: 2`, `borderRadius: 2`
and `bgcolor: 'background.default'`; it is now a plain `Box` that accepts `sx`
and `className`.

Elevation, background and width are statements about where the calculator sits,
which only the host knows - so asserting them is the same mistake as hardcoding
a color, the rule the skin contract already sets. Embedding the old widget in a
raised panel produced two nested shadows and, because `background.default` is
the page token rather than the surface token, a visible tonal patch where the
widget met its container.

BREAKING CHANGE: the widget now has no width, padding, background, radius or
shadow. Supply the surface yourself to keep the previous appearance. `width`
sizes the key grid, so a wrapper's padding sits outside it - 288 plus `p: 2`
gives the same 320-wide card as before:

```tsx
<Paper
  elevation={3}
  sx={{ p: 2, borderRadius: 2, bgcolor: 'background.default' }}
>
  <Calculator sx={{ width: 288, maxWidth: '100%' }} />
</Paper>
```
