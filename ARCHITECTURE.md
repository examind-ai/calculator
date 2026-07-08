# Architecture

`@examind/calculator` is a small set of packages arranged along **two
independent axes**. Knowing the axes is all you need to place a new package.

## Two axes

- **Engine (headless, framework-agnostic):** the `core` package, plus optional
  **mode** packages that extend it.
- **UI (skins):** one package per design system, each built on the `react`
  binding.

```
   core ──> react ──> skins:  @examind/calculator-mui       (shipped)
 (engine)   (hook)            @examind/calculator-shadcn    (planned)
    │                         @examind/calculator-<ds>      (future)
    │
    └─────> modes:  @examind/calculator-financial   (planned)
                    @examind/calculator-scientific  (planned)
```

## Packages

| Package | Axis | Depends on | Status |
| --- | --- | --- | --- |
| `calculator-core` | engine (base) | - | shipped |
| `calculator-react` | engine (React binding) | core | shipped |
| `calculator-mui` | skin | react | shipped |
| `calculator-financial` | mode | core | planned |
| `calculator-scientific` | mode | core | planned |
| `calculator-shadcn` | skin | react | planned |

> "Planned" rows describe the **pattern**, not a delivery commitment.

## Naming convention

- Core: `@examind/calculator-core`
- React binding: `@examind/calculator-react`
- **Modes** (headless eval plugins): `@examind/calculator-<domain>` - e.g.
  `-financial`, `-scientific`
- **Skins** (UI): `@examind/calculator-<design-system>` - e.g. `-mui`,
  `-shadcn`

The suffix disambiguates the axis on its own: a math domain is a mode, a design
system is a skin. No `-mode-` / `-skin-` infix needed.

## Contracts - how to add a package

**Basic arithmetic is not a package.** It is the baseline every calculator has,
so it lives inside `core` as the default `basicEvaluator` (which implements the
same `Evaluator` interface every mode uses - basic is just the bundled default).

### Adding a mode

- Implements the `Evaluator` interface from `core` and extends the basic
  operations (a financial calculator still needs `+ - x /`).
- Framework-agnostic; depends only on `core`. Consumers compose it into the
  engine via `useCalculator(evaluator)`.

### Adding a skin

- Consumes `useCalculator()` from `calculator-react` and renders the UI.
- **Draw only palette / theme tokens from the host - never hardcode colors.** A
  skin owns *structure* (layout, which keys, spans) but adopts the host design
  system's theme for *appearance*. For example, the MUI skin sets its button
  variant explicitly (structure) but takes every color from the host MUI theme.
- Keep keyboard and ARIA behavior in the hook, not re-implemented per skin.

## Why the split

`core` is the reusable, dependency-free gem. The `react` binding removes the
glue every skin would otherwise duplicate (reducer wiring, keyboard, selectors).
Skins stay thin. That is what makes "bring your own UI" real rather than
aspirational.
