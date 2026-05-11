# Contributing

Thanks for thinking about contributing! This is a small library; nothing exotic about the workflow.

## Setup

```sh
pnpm install
pnpm test:ci
```

`pnpm install` should succeed without prompts. If you see a "Run `pnpm approve-builds`" warning, your pnpm version is older than 10 — upgrade.

`pnpm test:ci` runs eslint, vitest, `tsc`, the build, and `publint` across both packages.

## Workflow

1. Branch off `main`.
2. Make your change. Add or update tests under `packages/react-start-toast/tests/`.
3. Run `pnpm test:ci` locally. Everything should be green.
4. **Add a changeset** describing what changed (see below).
5. Open a PR. CI re-runs `pnpm test:ci`. The "Version Packages" bot will pick up your changeset on merge.

## Changesets

Every user-facing change needs a changeset. Run:

```sh
pnpm changeset
```

It'll ask which packages changed and what kind of bump. **While we're on `0.x`, please:**

- Pick `minor` for breaking API changes (in `0.x`, minor bumps are the breaking-change tier).
- Pick `patch` for everything else — new exports, bug fixes, perf, docs that show up in the changelog.
- Skip changesets entirely for repo-only changes that don't touch published behavior: CI tweaks, internal docs, example app changes, refactors with no API impact.

The changeset goes in `.changeset/<name>.md`. Write the description in the past tense, as if it's already in the changelog:

> Fixed `redirectWithError` swallowing the redirect location when called with a relative path.

Not:

> This PR fixes a bug where…

## Scope of the published package

Only `packages/react-start-toast` is published to npm. `start-toast-core` is workspace-internal — its code is bundled into the React adapter at build time. Changes to either flow through the same `react-start-toast` changeset.

## Local development

- `pnpm --filter react-start-toast test:lib --watch` — vitest in watch mode.
- `pnpm --filter start-toast-example-basic dev` — runs the example app against the workspace-linked lib. Useful for end-to-end manual testing.
- `pnpm --filter start-toast-example-basic test:e2e` — Playwright e2e tests against a built example.
