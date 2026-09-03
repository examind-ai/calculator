# CLAUDE.md

`@examind/calculator` - a headless calculator engine with framework skins. pnpm
workspace, Node 22, TypeScript, Vitest, tsup, MIT.

## Packages

- `@examind/calculator-core` - engine (state machine + exact decimal evaluator +
  eval interface). One dependency, decimal.js, imported only in `value.ts`.
- `@examind/calculator-react` - `useCalculator()` headless React binding.
- `@examind/calculator-mui` - React + MUI skin.
- `demo/` - Vite app (deployed to GitHub Pages).

See `ARCHITECTURE.md` for the two-axis model and how modes / skins fit.

## Commands

```bash
pnpm install
pnpm build        # all packages, topological (core -> react -> mui)
pnpm test         # vitest run
pnpm typecheck
pnpm lint
pnpm --filter demo dev                          # demo dev server
GITHUB_PAGES=true pnpm --filter demo build      # demo for the Pages base path
```

The demo consumes the packages' built `dist` - rebuild a package after editing
its source before re-checking the demo.

## Conventions

- **Commits: Conventional Commits** - see `CONTRIBUTING.md`. No AI / Claude
  attribution in commit messages.
- **Skins draw only palette / theme from the host** - never hardcode colors. The
  component owns structure; the host owns appearance.
- New **modes** implement the `Evaluator` interface from `core`; new **skins**
  consume `useCalculator()` from `calculator-react`.
- **Numbers are `Value` strings, never JS `number`.** Arithmetic and rounding
  live behind the `Evaluator` seam; `state.ts` must not do math or call
  `Number()`. Only `value.ts` imports decimal.js.
- Results are computed at 40 significant digits and displayed at 15; the exact
  result is carried in `state.value` through `=`, unary, percent and negate.
- Never use em / en dashes in code or docs - plain hyphens only.

## Dev engine

The autonomous dev engine's per-repo contract (base branch, provision, bring-up,
verify surface + selectors) lives in **`.claude/dev-engine.md`**. The engine's
procedure is the generic `dev-engine` skill in the `claude-workspace` repo.
