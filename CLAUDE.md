# CLAUDE.md

`@examind/calculator` - a headless calculator engine with framework skins. pnpm
workspace, Node 22, TypeScript, Vitest, tsup, MIT.

## Packages

- `@examind/calculator-core` - engine (state machine + basic evaluator + eval
  interface), zero deps.
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
- Never use em / en dashes in code or docs - plain hyphens only.

## Verify (gates for automated runs)

- `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` must all pass.
- UI: `pnpm --filter demo dev` serves the demo (Vite, default port 5173); drive
  headless Chromium against it to verify rendered behavior.
