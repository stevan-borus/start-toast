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

### 2. Add a `.server.ts` re-export

Create one local file in your source tree that re-exports the server-only helpers you'll use. The `.server.ts` extension activates TanStack Start's import-protection plugin (matches `**/*.server.*`), which tells Vite to externalize anything imported from this file from the client bundle.

```ts
// src/flash-toast-bridge.server.ts
export {
  consumeFlashToast,
  redirectWithError,
  redirectWithSuccess,
  setFlashToast,
  // ...whichever helpers you actually use
} from '@tanstack/react-start-toast/server'
```

Every server-only import in the rest of your app goes through this file at the top level — no dynamic-import ceremony needed at call sites. See [Why a `.server.ts` re-export?](#why-a-serverts-re-export) below for why this matters.

### 3. Define a local server fn that reads the cookie

`consumeFlashToastFn` is the one RPC seam the bridge needs — your `__root.tsx` loader calls it to surface the staged toast. It's not published from the lib (TSS's compiler only strips server-fn handler bodies for files in your source tree, not pre-built lib files), so each consumer defines it locally:

```ts
// src/flash-toast.functions.ts
import { createServerFn } from '@tanstack/react-start'
import type { FlashToast } from '@tanstack/react-start-toast'
import { consumeFlashToast } from './flash-toast-bridge.server'

export const consumeFlashToastFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<FlashToast | null> => consumeFlashToast(),
)
```

### 4. Wire the renderer in `__root.tsx`

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

### 5. Stage toasts from server fns

Top-level imports from your `.server.ts` bridge work everywhere — no per-handler dynamic imports, no special handling.

```ts
// src/auth.functions.ts
import { createServerFn } from '@tanstack/react-start'
import { redirectWithSuccess } from './flash-toast-bridge.server'

export const loginFn = createServerFn({ method: 'POST' }).handler(async () => {
  await myAuth.signIn(/* ... */)
  return redirectWithSuccess('/dashboard', 'Welcome back!')
})
```

Or stage without redirecting:

```ts
import { setFlashToast } from './flash-toast-bridge.server'

// ...inside any server fn handler:
await setFlashToast({ message: 'Saved', type: 'success' })
return data
```

### 6. Trigger from a full navigation

Flash toasts work via a cookie set on one response and read on the next request. That two-request handshake means the trigger has to be a **full page navigation** — not a client-side router transition.

The patterns that already are full navigations:

- HTML form submissions (login, signup, settings save, etc.)
- OAuth callback redirects
- Email verification link clicks
- Sign-out forms

If you trigger a `redirectWith*` from a client-side `<Link>` click or a `useMutation` callback, the destination loader runs before the browser commits the flash cookie, and the toast doesn't fire until refresh. **For client-side actions, fire your toast UI directly in the mutation's `onSuccess`** — `toast.success('Saved')` straight to sonner, no cookie involved. The cookie bridge exists for full-navigation flows; if your trigger is already in client land, you don't need it.

```html
<!-- ✅ Form submission — full navigation, cookie commits, toast fires -->
<form method="POST" action="/login">
  ...
</form>
```

```ts
// ✅ Client mutation — fire your toast UI directly, no cookie bridge
const mutation = useMutation({
  mutationFn: () => loginFn({ data }),
  onSuccess: () => toast.success('Welcome back!'),
})
```

```tsx
// ❌ <Link> through a redirect-throwing loader — race; toast won't show until refresh
<Link to="/trigger">Go</Link>
```

The example app's index page is a form submission to demonstrate the cookie-bridge path exactly.

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

## Why a `.server.ts` re-export?

A direct top-level import from `@tanstack/react-start-toast/server` from a route file or root layout — e.g. `import { consumeFlashToast } from '@tanstack/react-start-toast/server'` at the top of `__root.tsx` — crashes the production build with:

```
[plugin vite:resolve] Module "node:async_hooks" has been externalized for browser compatibility,
imported by ".../start-server-core/.../request-response.js"
```

Reason: route files don't go through TanStack Start's server-fn handler-stripping transform, so any top-level import is just a regular module import. `@tanstack/react-start-toast/server` transitively imports h3 (`getCookie`/`setCookie`), which transitively imports `node:async_hooks`. The whole chain ends up in the client graph and Vite refuses to bundle the Node-only module.

The same import inside a server-fn module (`*.functions.ts`) sometimes works because TSS's compile-time transform replaces the handler body with a fetch wrapper — and if the only reference to the imported binding is inside that body, the import gets tree-shaken on the client. But that's a fragile guarantee: a single component-level reference to the binding, or a different file shape, breaks it. Empirically we've seen leaks from non-route files too.

The `.server.ts` extension on a local re-export file fixes this categorically: TSS's import-protection plugin matches the `**/*.server.*` glob and tells Vite to externalize the module from client bundles entirely, regardless of what file imports it or how. Your other files import from the bridge with normal top-level `import` statements — the boundary is enforced by the `.server.ts` filename, not by per-call-site discipline or per-file luck.

The example app includes a Playwright bundle-leak guard that fails CI if `AsyncLocalStorage` (or any other server-only marker) ever appears in a client asset. Worth copying if you publish your own consumer of this lib.

> **Alternative — dynamic import inside the handler.** If you can't use a `.server.ts` filename for some reason (custom build configs, restricted file naming), you can move the import inside the server-fn handler body where it becomes part of the dead body the transform removes:
>
> ```ts
> .handler(async () => {
>   const { consumeFlashToast } = await import('@tanstack/react-start-toast/server')
>   return consumeFlashToast()
> })
> ```
>
> Works, but you pay the ceremony at every call site. The `.server.ts` re-export is the recommended pattern.

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

- One `flash-toast-bridge.server.ts` re-export, two thin `*.functions.ts` files, top-level imports throughout
- All 10 helpers exercised through real navigation (HTML form submission)
- Playwright e2e suite (12 tests) verifying every helper through SSR + hydration + DOM assertions, plus a bundle-leak guard that fails CI if any client asset references `AsyncLocalStorage`

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
