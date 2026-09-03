# @examind/calculator

A headless calculator engine with framework skins - the same core, any UI.

**[Live demo &rarr;](https://examind-ai.github.io/calculator/)**

- **Headless core** - state machine + exact decimal evaluator, framework-agnostic.
- **React binding** - a `useCalculator()` hook; bring your own UI.
- **MUI skin** - a ready-to-use component that adopts your MUI theme.

Built for exam rooms, where a wrong digit is not an option:

- **Exact arithmetic.** `0.1 + 0.2` is `0.3` because it is, not because the
  display hides binary float noise. Results are computed at 40 significant
  digits (decimal.js) and shown at 15.
- **Precision carries through `=`.** `1 / 3 = x 3 =` is `1`; the next
  operation always consumes the exact result, never the rounded display.
- **Standard precedence.** `2 + 3 x 4 = 14`, left-to-right within a level.
- **Readable numbers.** Thousands separators on both display lines
  (`1,234,567 x 2 =` over `2,469,134`), like the iPhone and Windows
  calculators. Presentation only; `grouping={false}` turns it off.
- **Property-tested** against an independent exact-rational oracle, plus a
  golden keystroke table for percent, repeated `=`, CE / C, negate and error
  recovery.

## Install

Most apps want the ready-made MUI component:

```bash
npm install @examind/calculator-mui @mui/material @emotion/react @emotion/styled
```

```tsx
import Calculator from '@examind/calculator-mui';

export default () => <Calculator sx={{ width: 288 }} />;
```

It renders inside your MUI `ThemeProvider` and takes on your palette.

The widget renders **no surface of its own** - no elevation, no background, no
radius. That's yours to decide, because only you know where it sits. For a card:

```tsx
<Paper elevation={3} sx={{ p: 2 }}>
  <Calculator sx={{ width: 288 }} />
</Paper>
```

Omit `width` to let the grid fill its container.

### Bring your own UI

```bash
npm install @examind/calculator-react
```

```tsx
import { useCalculator } from '@examind/calculator-react';

const MyCalculator = () => {
  const { display, expression, clearMode, dispatch } =
    useCalculator();
  // Render however you like; dispatch actions like { type: 'digit', value: '7' }.
};
```

### Just the engine (no React)

```bash
npm install @examind/calculator-core
```

## Design

The library grows along **two independent axes** - a headless **engine**
(`core` + optional **modes**) and **skins** (one per design system) built on the
`react` binding. Everything plugs into `core`.

| Package                     | What it is                                                                   |  Ships  |
| --------------------------- | ---------------------------------------------------------------------------- | :-----: |
| `@examind/calculator-core`  | engine: state machine + exact decimal evaluator (one dependency: decimal.js) | &#9989; |
| `@examind/calculator-react` | `useCalculator()` headless React binding                                     | &#9989; |
| `@examind/calculator-mui`   | React + MUI skin                                                             | &#9989; |

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the full model and how new modes /
skins fit.

## Development

pnpm workspace, Node 22.

```bash
pnpm install
pnpm build                 # build all packages
pnpm test                  # vitest
pnpm --filter demo dev     # run the demo
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE)
