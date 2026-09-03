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

| Package                 | Axis                   | Depends on | Status  |
| ----------------------- | ---------------------- | ---------- | ------- |
| `calculator-core`       | engine (base)          | -          | shipped |
| `calculator-react`      | engine (React binding) | core       | shipped |
| `calculator-mui`        | skin                   | react      | shipped |
| `calculator-financial`  | mode                   | core       | planned |
| `calculator-scientific` | mode                   | core       | planned |
| `calculator-shadcn`     | skin                   | react      | planned |

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

### Numbers cross the seam as `Value` strings

Every operand and result that crosses the `Evaluator` interface, and everything
stored in `CalculatorState`, is a `Value`: a branded canonical decimal string
such as `"0.3"` or `"0.3333333333333333333333333333333333333333"`. Never a JS
`number`. Strings are exact, JSON-safe and library-neutral, so no layer outside
the evaluator can reintroduce binary floating point.

Inside `core`, `value.ts` is the only module that imports decimal.js: a private
clone at 40 significant digits, round half up, isolated from any host
configuration. `basicEvaluator` parses `Value` -> `Decimal`, computes, and
serialises back. Swapping the library means editing that one file and its tests.

The state machine holds two things for the current register: `entry`, the
string being typed or the 15-digit rounded view of a result, and `value`, the
exact result when there is one. Every follow-on operation consumes `value`, so
`1 / 3 = x 3 =` is exactly `1`.

### Adding a mode

- Implements the `Evaluator` interface from `core` - `parse`, `evaluate`,
  `applyUnary`, `percent`, `format`, all `Value` in / `Value` out - and extends
  the basic operations (a financial calculator still needs `+ - x /`).
- Framework-agnostic; depends only on `core`. Consumers compose it into the
  engine via `useCalculator(evaluator)`.
- The seam exists for our own modes, not as a public extension point. It also
  protects against replacing the decimal library, not against running two:
  one numeric type across every mode, always.

### Adding a skin

- Consumes `useCalculator()` from `calculator-react` and renders the UI.
- **Draw only palette / theme tokens from the host - never hardcode colors.** A
  skin owns _structure_ (layout, which keys, spans) but adopts the host design
  system's theme for _appearance_. For example, the MUI skin sets its button
  variant explicitly (structure) but takes every color from the host MUI theme.
- **Render no surface - the host owns it.** A skin must not set elevation,
  background, border radius, outer padding or width on its root. Where the
  calculator sits (flush in a page section, inside a floating panel, filling a
  responsive column) is something only the host knows, so asserting it is the
  same mistake as hardcoding a color, one level up. Accept `sx` / `className` so
  the host can size and space the widget, and leave the root a plain `Box`.
- Keep keyboard and ARIA behavior in the hook, not re-implemented per skin.

## Why the split

`core` is the reusable gem (its one dependency is decimal.js). The `react` binding removes the
glue every skin would otherwise duplicate (reducer wiring, keyboard, selectors).
Skins stay thin. That is what makes "bring your own UI" real rather than
aspirational.
