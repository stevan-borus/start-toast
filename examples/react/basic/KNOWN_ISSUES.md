# Known Issues

## Upstream TanStack Start dev-mode version skew

**Status:** affects dev mode only. Production build (`pnpm build && pnpm start`) and the published lib are unaffected.

`@tanstack/react-start@1.167.50+` declares `@tanstack/start-plugin-core@1.169.x` while pulling `@tanstack/start-server-core@1.167.x`. The 1.169 plugin-core renamed an internal virtual module (`tanstack-start-injected-head-scripts:v`) that 1.167 server-core still tries to import, so any route loader that calls a server fn 500s in dev with:

```
[plugin:vite:import-analysis] Failed to resolve import "tanstack-start-injected-head-scripts:v"
```

The repo workaround pins coherent 1.167.x versions of all three internals via `pnpm.overrides` in the root `package.json`. This keeps `pnpm dev` working in this workspace.

**Consumers of the published `react-start-toast` are NOT affected** — the lib's `dist/` doesn't reach into the broken modules; it imports the public TSS surface (`@tanstack/react-start`, `@tanstack/react-router`, `@tanstack/react-start/server`). If the consumer's own TSS dev server boots cleanly (or they're on a coherent version pair), the lib works. The Playwright e2e suite in this example app is verified to pass against:

- `react-start@1.167.40` + `plugin-core@1.167.34` (the workspace pins, used during local development)
- `react-start@1.167.65` + `plugin-core@1.169.20` (latest at time of writing) — production build only; dev mode broken by the upstream skew above

**Resolution path:** wait for TSS to ship a coordinated release where plugin-core, server-core, and client-core are all on the same minor. Then remove the `pnpm.overrides` block in the root `package.json` and bump `@tanstack/react-start` here to whatever shipped together. Track upstream: <https://github.com/TanStack/router/issues>

## Verifying the lib against multiple TSS versions

The lib's runtime works against any TSS version where the consumer's own app boots. To verify against a specific version yourself:

```sh
# In a fresh consumer app:
pnpm add react-start-toast
pnpm add @tanstack/react-start@<target-version>
# Wire up per the lib README, then exercise a flow that goes through redirectWithSuccess.
```

If the consumer app's `pnpm build && pnpm start` boots cleanly, the lib will work.
