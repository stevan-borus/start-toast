# start-toast

> Server-set toast notifications for [TanStack Start](https://tanstack.com/start). A 1:1 adaptation of [`remix-toast`](https://github.com/code-forge-io/remix-toast) for TanStack Start's server-fn / cookie-bridge model.

If you've used `remix-toast`, you already know the API — `setFlashToast`, `redirectWithSuccess`, `consumeFlashToast`, etc. — they work the same way. This lib closes the equivalent gap for TanStack Start.

> **Status:** pre-release. APIs may change before `0.1.0`. Not yet on npm — install via `git+https` or as a workspace package.

## Features

- **Headless** — bring your own toast UI (sonner, react-toastify, your own). The lib only fires `notify(toast)` and lets you render the rest.
- **Type-safe** — every export is fully typed; the wire format is a `zod` schema.
- **Strict server/client split** — server helpers ship under `/server`; only the React adapter touches the client bundle.
- **Composable** — orthogonal helpers (`setFlashToast`, `redirectWithError`, `<ToastProvider>`) compose inside your own server fns.
- **Footgun-proofed** — `<ToastProvider>` bakes in the source-order rule so subscribe-on-mount toast UIs receive the event.

## Install

```sh
pnpm add @tanstack/react-start-toast
```

The lib peer-depends on `@tanstack/react-router`, `@tanstack/react-start`, `react`, and `react-dom`.

## Setup

The lib has **two entrypoints**, by design:

| Import path                            | Use from                  | Provides                                                                                                                              |
| -------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `@tanstack/react-start-toast`          | Client-bundled files      | `FlashToastEffect`, `ToastProvider`, type re-exports                                                                                  |
| `@tanstack/react-start-toast/server`   | Server-only files         | `setFlashToast`, `consumeFlashToast`, `setFlashCookieOptions`, `redirectWith*`, `replaceWith*`                                        |

Why the split: the `/server` entry imports h3's `getCookie`/`setCookie` (which pull `node:async_hooks`). If the renderer and the server helpers shared one entry, any consumer who bundled the renderer for the browser would crash hydration with `AsyncLocalStorage is not a constructor`. Splitting keeps server-only code purely server-side.

### 1. Set the cookie secret

Set `START_TOAST_SECRET` (≥32 characters) in your server environment. That's the only required setup.

For runtime-resolved secrets (Vault, AWS Secrets Manager, etc.), call `setFlashCookieOptions` once at app boot from a server-bundled file:

```ts
// In e.g. src/server.ts (anywhere server-only)
import { setFlashCookieOptions } from '@tanstack/react-start-toast/server'

setFlashCookieOptions({
  name: 'my-flash',
  maxAge: 30,
  secret: () => myVault.read('flash-secret'),
})
```

Precedence: explicit config > env var > throw.

### 2. Define a local server fn that reads the cookie

Each consumer defines their own `consumeFlashToastFn`. The reason: TanStack Start's compiler strips server-fn handler bodies from the client bundle per file in your source tree — but it does **not** transform pre-built lib files. A `consumeFlashToastFn` shipped from the lib would survive the transform on the client and pull h3 into the browser.

The recipe is one file, ~10 lines, copy-paste from the example app:

```ts
// src/flash-toast.functions.ts
import { createServerFn } from '@tanstack/react-start'
import type { FlashToast } from '@tanstack/react-start-toast'

export const consumeFlashToastFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<FlashToast | null> => {
    // Dynamic import keeps the server-only chain out of the client bundle.
    const { consumeFlashToast } = await import(
      '@tanstack/react-start-toast/server'
    )
    return consumeFlashToast()
  },
)
```

The dynamic `await import()` is load-bearing — see [Why a dynamic import?](#why-a-dynamic-import) below.

### 3. Wire the renderer in `__root.tsx`

```tsx
import { createRootRoute, Outlet, Scripts } from '@tanstack/react-router'
import { ToastProvider } from '@tanstack/react-start-toast'
import { Toaster, toast } from 'sonner'
import { consumeFlashToastFn } from '../flash-toast.functions'

export const Route = createRootRoute({
  loader: async () => ({ flashToast: await consumeFlashToastFn() }),
  component: RootComponent,
})

function RootComponent() {
  const { flashToast } = Route.useLoaderData()
  return (
    <ToastProvider
      toaster={<Toaster />}
      toast={flashToast}
      notify={(t) => toast[t.type](t.message, t)}
    >
      <Outlet />
    </ToastProvider>
  )
}
```

`<ToastProvider>` mounts the toaster first, then the bridge, so subscribe-on-mount UIs (sonner, react-toastify, etc.) are listening before the bridge fires `notify`. If you compose the pieces yourself with `<FlashToastEffect>`, the same source-order rule applies — see [Source-order constraint](#source-order-constraint).

### 4. Stage toasts from server fns

```ts
// src/auth.functions.ts
import { createServerFn } from '@tanstack/react-start'

export const loginFn = createServerFn({ method: 'POST' }).handler(async () => {
  const { redirectWithSuccess } = await import(
    '@tanstack/react-start-toast/server'
  )
  await myAuth.signIn(/* ... */)
  return redirectWithSuccess('/dashboard', 'Welcome back!')
})
```

Or stage without redirecting:

```ts
const { setFlashToast } = await import('@tanstack/react-start-toast/server')
await setFlashToast({ message: 'Saved', type: 'success' })
return data
```

## API reference

### `/server` (server-only)

| Export                    | Signature                                                                                  | Notes                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ |
| `setFlashToast`           | `(input: FlashToastInput, defaultType?: FlashToastType) => Promise<void>`                  | Stage a toast on the response cookie. Last write wins.                               |
| `consumeFlashToast`       | `() => Promise<FlashToast \| null>`                                                        | Read + clear the staged toast. Returns `null` if none.                               |
| `setFlashCookieOptions`   | `(opts: FlashCookieOptions) => void`                                                       | Override defaults: `name`, `maxAge`, `secret`, `path`, `sameSite`, `secure`, `httpOnly`. |
| `redirectWithToast`       | `(href: string, input: FlashToastInput) => Promise<never>`                                 | Stage + `throw redirect(href)`. Defaults `type: 'info'`.                             |
| `redirectWithSuccess`     | same                                                                                       | Defaults `type: 'success'`.                                                          |
| `redirectWithError`       | same                                                                                       | Defaults `type: 'error'`.                                                            |
| `redirectWithInfo`        | same                                                                                       | Defaults `type: 'info'`.                                                             |
| `redirectWithWarning`     | same                                                                                       | Defaults `type: 'warning'`.                                                          |
| `replaceWith*` (5 of)     | `(href, input) => Promise<never>`                                                          | Same as `redirectWith*` but `replace: true` — back button skips the trigger page.    |

### Root entry (client-safe)

| Export                | Signature                                                              | Notes                                                                                  |
| --------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `<FlashToastEffect>`  | `{ toast: FlashToast \| null, notify: (t: FlashToast) => void }`       | Effect-only renderer. Dedupes by `_id` in `sessionStorage`.                            |
| `<ToastProvider>`     | `{ toaster, toast, notify, children }`                                 | Composes `<Toaster>` + `<FlashToastEffect>` in safe source order.                      |
| `FlashToast` (type)   | `{ message, type, _id, description?, duration? }`                      | The wire format.                                                                       |
| `FlashToastInput`     | `string \| { message, type?, description?, duration? }`                | What `setFlashToast` and `redirectWith*` accept.                                       |
| `FlashToastType`      | `'info' \| 'success' \| 'error' \| 'warning'`                          |                                                                                        |

## Why a dynamic import?

The pattern `await import('@tanstack/react-start-toast/server')` inside a server-fn handler is required for any consumer file that's **also imported from a client-bundled file** (the trigger route, the root loader, anything reachable from the browser).

TanStack Start's compiler transforms `createServerFn(...).handler(body)` so that on the client, `body` is replaced with a fetch wrapper. But the transform only rewrites the handler — it does NOT remove top-level `import` statements from the file. So a top-level `import { setFlashToast } from '@tanstack/react-start-toast/server'` survives the transform, gets bundled for the client, and pulls `node:async_hooks` into the browser.

Putting the import inside the handler body means the import is part of the dead body the transform removes. Both server fns in the [example app](./examples/react/basic) use this pattern.

If your `*.functions.ts` file is only ever imported from server-bundled code (never from a route loader or `__root.tsx`), top-level imports are fine.

## Source-order constraint

Subscribe-on-mount toast UIs (sonner, react-toastify, sonner-react, custom) buffer events that arrive before they've subscribed but **don't replay them**. React commits sibling effects in source order, so:

```tsx
// ✅ Correct — toaster mounts first, subscribes, then the bridge fires
<Toaster />
<FlashToastEffect toast={t} notify={notify} />

// ❌ Wrong — bridge fires before toaster subscribes; toast is silently dropped
<FlashToastEffect toast={t} notify={notify} />
<Toaster />
```

`<ToastProvider>` bakes the correct order in. Reach for `<FlashToastEffect>` directly only if you need explicit control.

## Example app

A working end-to-end example lives in [`examples/react/basic`](./examples/react/basic):

- All 10 helpers exercised through real navigation
- Both `*.functions.ts` patterns (server-fn for reading, server-fn for writing)
- Playwright e2e suite (11 tests) verifying every helper through SSR + hydration + DOM assertions

```sh
cd examples/react/basic
pnpm install
START_TOAST_SECRET=$(openssl rand -hex 32) pnpm dev
```

## Packages

| Package                       | Description                                                                |
| ----------------------------- | -------------------------------------------------------------------------- |
| `@tanstack/start-toast-core`  | Framework-agnostic primitives. Used transitively, rarely imported directly. |
| `@tanstack/react-start-toast` | React + TanStack Start adapter. **The package most consumers want.**       |

## Get involved

- File issues at [github.com/stevan-borus/start-toast/issues](https://github.com/stevan-borus/start-toast/issues)
- Open a PR — see [`docs/adr/0001-roadmap.md`](./docs/adr/0001-roadmap.md) for the design target before adding new exports

## License

[MIT](./LICENSE)
