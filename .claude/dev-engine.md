# Dev Engine contract - @examind/calculator

Repo-specific inputs the generic dev-engine skill (in claude-workspace) reads to provision and
verify this repo. See `claude-workspace/.claude/skills/dev-engine/SKILL.md` for the procedure.

## Base branch
`main`

## Provision
```bash
pnpm install
pnpm build   # builds all packages topologically (core -> react -> mui)
```
Node 22 + pnpm 9.15.4 (via corepack) are provided by the "node-lib" environment.

## Bring-up (UI verification)
```bash
pnpm --filter demo dev    # Vite demo, http://localhost:5173/
```
Ready when the `Local: http://localhost:5173/` line prints (or the port responds).

## Verify
**Gates (all must pass):**
```bash
pnpm build
pnpm typecheck
pnpm test        # Vitest
pnpm lint
```
**UI surface:** the demo at `http://localhost:5173/` renders the MUI skin (and a bare `useCalculator`
skin). Drive the pre-installed Chromium over CDP against it. Stable selectors:
- `calculator-display` - the main line
- `calculator-expression` - the top line
- `calc-key-*` - keys (e.g. `calc-key-7`, `calc-key-add`, `calc-key-equals`, `calc-key-clear`)

## Conventions
- **Commits:** Conventional Commits (`feat` / `fix` / `docs` / `chore` / ...), scope = package
  (`core` / `react` / `mui` / `demo`). No AI/Claude attribution.
- **Changeset required** for any change to a published package (`core` / `react` / `mui`): add
  `.changeset/<slug>.md` with the bumped packages + a one-line summary. `demo` is private (no changeset).
- **Tests:** Vitest, `*.test.ts` colocated in `packages/*/src`. Node env (jsdom not configured yet);
  DOM-layout behavior (e.g. font auto-fit) is verified in-browser via CDP, not unit tests.

## Quirks
- The demo consumes each package's built `dist` - after editing a package's source, rebuild it
  (`pnpm build` or `pnpm --filter <pkg> build`) before re-checking the demo.
- Architecture: logic in `core`, hook glue in `react`, presentation in a skin (`mui`); a skin draws
  only palette/theme from the host - never hardcode colors. See `ARCHITECTURE.md`.
