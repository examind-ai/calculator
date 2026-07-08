# Contributing

## Setup

Node 22 (see `.nvmrc`), pnpm 9.

```bash
pnpm install
pnpm build        # build all packages (topological: core -> react -> mui)
pnpm test         # vitest
pnpm typecheck
pnpm lint
pnpm --filter demo dev   # run the demo
```

The demo consumes the packages' built `dist`, so rebuild a package after editing
its source before re-checking the demo.

## Commit convention

This repo uses [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <summary in the imperative>

<optional body>

<optional footer, e.g. BREAKING CHANGE: ...>
```

- **Types:** `feat` `fix` `docs` `refactor` `test` `build` `ci` `chore` `perf`
  `style`
- **Scope** (optional): the package - `core`, `react`, `mui`, `demo`
- **Semver mapping:** `feat` -> minor, `fix` -> patch, a `BREAKING CHANGE:`
  footer -> major

Examples:

```
feat(react): add useCalculator option for a custom evaluator
fix(mui): set explicit contained button variant
docs: document the two-axis package model
```

Do not include AI / assistant attribution in commit messages.

## Changesets

Versions and changelogs are managed with
[Changesets](https://github.com/changesets/changesets). For any change that
affects a published package, add a changeset:

```bash
pnpm changeset
```

Pick the affected packages and bump level, and write a one-line summary. The
release workflow opens a "Version Packages" PR; merging it publishes to npm.

## Pull requests

- Branch off `main` and open a PR.
- CI must pass: build, typecheck, test, lint.
- Include a changeset when you touch a published package.
