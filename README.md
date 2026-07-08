# @examind/calculator

A headless calculator engine with framework skins - the same core, any UI.

**[Live demo &rarr;](https://examind-ai.github.io/calculator/)**

- **Headless core** - state machine + evaluator, zero dependencies, framework-agnostic.
- **React binding** - a `useCalculator()` hook; bring your own UI.
- **MUI skin** - a ready-to-use component that adopts your MUI theme.

## Install

Most apps want the ready-made MUI component:

```bash
npm install @examind/calculator-mui @mui/material @emotion/react @emotion/styled
```

```tsx
import Calculator from '@examind/calculator-mui';

export default () => <Calculator />;
```

It renders inside your MUI `ThemeProvider` and takes on your palette.

### Bring your own UI

```bash
npm install @examind/calculator-react
```

```tsx
import { useCalculator } from '@examind/calculator-react';

const MyCalculator = () => {
  const { display, expression, clearMode, dispatch } = useCalculator();
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

| Package | What it is | Ships |
| --- | --- | :---: |
| `@examind/calculator-core` | engine: state machine + basic evaluator + eval-plugin interface (zero deps) | &#9989; |
| `@examind/calculator-react` | `useCalculator()` headless React binding | &#9989; |
| `@examind/calculator-mui` | React + MUI skin | &#9989; |

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
