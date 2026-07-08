---
name: dev-engine
description: >
  Autonomous post-plan implementation engine for the @examind/calculator monorepo.
  Pulls ONE ready issue (label `ready-for-engine`), implements its spec, verifies in a
  cloud VM (pnpm build/typecheck/test/lint + the Vite demo driven over CDP), self-fixes
  within bounds, and opens a DRAFT PR to `main` that `Closes` the issue - or parks with a
  diagnosis. Never merges. Routine-only skill, runs in the "Dev Engine - Calculator" env.
---

# Dev Engine - Calculator

Turns an approved technical design into a reviewed draft PR, autonomously, in a cloud VM.
The human owns planning (the GitHub issue's spec + acceptance criteria); the engine owns
the slow middle; the human owns the final PR review. This is "prep-and-park": it produces
a draft PR or stops - it NEVER merges.

## Where work comes from
- The **technical design = a GitHub issue** in `examind-ai/calculator`. The body holds the
  *how*: what to change, affected packages, **acceptance criteria** (checkable), out-of-scope.
- **Readiness = the `ready-for-engine` label** (set by the human when the design is complete).
- One issue = one unit of work = one PR.

## Repo shape (read ARCHITECTURE.md)
pnpm workspace, Node 22, TypeScript, Vitest, tsup, MIT. Two axes:
- **Engine (headless):** `@examind/calculator-core` (state machine + basic evaluator + eval
  interface, zero deps) + optional mode packages.
- **UI (skins):** `@examind/calculator-react` (`useCalculator()` hook) and skins on it
  (`@examind/calculator-mui`). A skin draws only palette/theme from the host - never hardcode
  colors. Put logic in core, hook glue in react, presentation in the skin.

## Dependencies
- **Env:** "Dev Engine - Calculator". Setup enables `pnpm@9.15.4` via corepack; base image has
  Node 22 + a pre-installed Chromium. No app secrets, no emulators, no backend.
- **GitHub:** the VM has **no `gh` CLI** - use the **GitHub MCP tools** for issues / PRs /
  labels / comments. `GH_TOKEN` is injected for `git` clone/push.

## Inviolable guardrails (read first)
1. **Verify ONLY under the acceptance criteria's stated conditions.** If you cannot reach green
   within them, PARK - do NOT weaken, reroute, or invent a path to green.
2. **Draft PR only. Never merge. Base = `main`.**
3. **Minimal change surface.** If the spec needs edits outside its stated scope, PARK.
4. **Bounded fix attempts** (default 5). Then PARK.
5. **One issue per run.** Pull exactly one; never fan out.
6. Repo conventions: **Conventional Commits** (see CONTRIBUTING.md); **no AI/Claude attribution**
   in commits; **add a Changeset** for any change to a published package (`pnpm changeset`, or
   write `.changeset/<slug>.md` with the bumped packages + summary); PR body ends `Closes #<n>`;
   commit before finishing.

## Step 0 - Pull one ready issue
Use the **GitHub MCP** to list open issues in `examind-ai/calculator` labeled `ready-for-engine`.
If none, report "nothing ready" and stop. If the run named an issue, use it; else the **oldest**.
Read that issue - its body is your contract (spec + acceptance criteria). If the criteria are
missing or not checkable, PARK and say so.

## Step 1 - Provision
At the repo root (cwd is the calculator checkout): `pnpm install`; `pnpm build`.

## Step 2 - Branch
`git checkout -b engine/issue-<n>-<slug>` off `main`.

## Step 3 - Implement
Make the change per the spec, minimal surface, respecting the core/react/mui split. **Write
Vitest unit tests for any non-trivial pure logic you add or change** (evaluator, reducer,
formatting) following the repo's `*.test.ts` convention. If you edit a package's source, rebuild
it (`pnpm build`, or `pnpm --filter <pkg> build`) - the demo consumes the built `dist`.

## Step 4 - Bring up the demo
Start the Vite demo: `pnpm --filter demo dev`. Wait for the `Local: http://localhost:5173/`
line (or poll the port). This renders the MUI skin (`data-testid` `calculator-display`,
`calculator-expression`, `calc-key-*`) and a bare skin.

## Step 5 - Verify
For each acceptance criterion, under its EXACT stated conditions:
- **Gates:** `pnpm build`, `pnpm typecheck`, `pnpm test`, `pnpm lint` must all pass.
- **UI over CDP:** locate the pre-installed Chromium (under `/opt/pw-browsers/*/chrome-linux/chrome`
  - the version dir may differ, so find it at runtime; do NOT hardcode). Launch headless:
  `--headless=new --no-sandbox --no-proxy-server --disable-gpu --disable-dev-shm-usage
  --remote-debugging-port=<port>`. Connect over CDP (Node 22 has a global `WebSocket`; no
  Playwright/puppeteer is installed). Open `http://localhost:5173/`; interact and assert with a
  single `Runtime.evaluate` per step running **in-page JS** - click via
  `document.querySelector('[data-testid="..."]').click()` and read `textContent` of the target
  selectors. Prefer `Runtime.evaluate` + in-page `.click()` over synthetic `Input` events.

## Step 6 - Fix loop (bounded)
On any failed criterion: diagnose root cause, fix, rebuild, re-verify. Up to 5 attempts, then
PARK. Track each attempt (what failed, what you changed) for the PR + self-improvement signal.

## Step 7 - Gate
- **All criteria + all gates green** -> commit (Conventional Commits + a Changeset), push, open a
  **DRAFT PR to `main`**. PR body: summary, the ticked acceptance-criteria checklist, screenshots,
  what the fix loop hit, and `Closes #<n>`. Remove the `ready-for-engine` label. Stop. Do NOT merge.
- **Unmet after 5 / cannot verify under stated conditions / needs out-of-scope edits** -> PARK:
  no PR; comment a clear diagnosis on the issue, remove the `ready-for-engine` label, stop.

## Self-improvement
At the end of every run (PR or park), if you hit a *generalizable* lesson (a gotcha any future
run would face), open or comment on a GitHub issue labeled **`dev-engine-skill`** in
`examind-ai/calculator`. Do NOT edit this SKILL.md yourself - the skill only changes through a
human-approved PR.

---
## Thin trigger prompt (what the routine runs)
> On the cloned `examind-ai/calculator` repo (your cwd), `git fetch origin main && git checkout
> main`, then read `.claude/skills/dev-engine/SKILL.md` and follow it exactly. Pull ONE open issue
> labeled `ready-for-engine` (the one I named, else oldest), implement its spec, verify against its
> acceptance criteria in the VM (pnpm gates + the Vite demo over CDP), self-fix within bounds, and
> open a DRAFT PR to `main` that `Closes` the issue - or PARK with a diagnosis on the issue. Never
> merge. If nothing is ready, exit quietly.
