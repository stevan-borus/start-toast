# Known Issues

## Upstream TanStack Start version skew (2026-05-07)

`@tanstack/react-start@1.167.65` (latest published as of writing) declares a
dependency on `@tanstack/start-plugin-core@1.169.20`, but the start-server-core
and start-client-core packages it uses are pinned at `1.167.30` /  `1.168.2`
respectively. The 1.169 plugin-core renamed an internal virtual module
(`tanstack-start-injected-head-scripts:v`) which 1.167 server-core still tries
to import, so the dev server boots with a 500 error and the SSR client entry
fails to load.

The repo workaround (root `package.json`) attempts to pin plugin-core to
1.167.30, but 1.167.30's `./vite` subpath has different exports, so the
override breaks the import path inside react-start itself.

**The lib itself is unaffected** — it builds (`pnpm --filter
@tanstack-start-toast/example-basic build`), it typechecks, and its 32 unit
tests pass. Vylit's production app uses the same code shape and works.

**Resolution path:** wait for TSS to ship a coherent set of releases, then
remove the `pnpm.overrides` block in the repo root and bump the example's
`@tanstack/react-start` to whatever shipped together. Track upstream:
https://github.com/TanStack/router/issues
