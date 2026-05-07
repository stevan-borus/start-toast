# start-toast

> Server-set toast notifications for [TanStack Start](https://tanstack.com/start).

`start-toast` is a 1:1 adaptation of [`remix-toast`](https://github.com/code-forge-io/remix-toast) for TanStack Start's server-fn / cookie-bridge model. If you've used `remix-toast`, you already know the API — `setFlashToast`, `redirectWithSuccess`, `consumeFlashToast`, etc. — they work the same way. This lib closes the equivalent gap for TSS.

> **Status: pre-release.** APIs may change before `0.1.0`. The lib code is in production use (vylit), but the published packages are not on npm yet — install via `workspace:*` or `git+https`.

---

## Packages

| Package                       | Description                                                                                                                                                  |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `@tanstack/start-toast-core`  | Framework-agnostic primitives: cookie sealing, schema, types. Rarely used directly — depends on it transitively via the framework adapter.                   |
| `@tanstack/react-start-toast` | React + TanStack Start adapter: `setFlashToast`, `consumeFlashToast`, `redirectWith*`, `replaceWith*`, `<FlashToastEffect />`. **Use this in your TSS app.** |

---

## Install

```bash
pnpm add @tanstack/react-start-toast
```

`@tanstack/react-start-toast` declares `@tanstack/react-router`, `@tanstack/react-start`, `react`, and `react-dom` as peer dependencies.

---

## Server setup

### 1. Configure the cookie secret at boot

The lib seals the flash cookie with `iron-webcrypto`. You provide the secret once, in your `__root.tsx` (top of the file, before `createRootRoute`).

```ts
// src/routes/__root.tsx
import { setFlashCookieOptions } from '@tanstack/react-start-toast'

setFlashCookieOptions({
  secret: process.env.SESSION_SECRET, // ≥ 32 chars
})
```

`setFlashCookieOptions` mirrors `remix-toast`'s `setToastCookieOptions` and accepts the same shape: `{ secret, name?, maxAge?, path?, sameSite?, secure?, httpOnly? }`.

> **Refusal-by-default.** If you call `setFlashToast` (or any `redirectWith*` / `replaceWith*` helper) without configuring a secret first, the lib throws a clear error. There is no insecure fallback.

### 2. Wire `consumeFlashToastFn` from the root loader

```tsx
// src/routes/__root.tsx
import {
  consumeFlashToastFn,
  FlashToastEffect,
} from '@tanstack/react-start-toast'

export const Route = createRootRoute({
  loader: async () => ({
    flashToast: await consumeFlashToastFn(),
  }),
  component: RootComponent,
})

function RootComponent() {
  const { flashToast } = Route.useLoaderData()
  return (
    <html>
      <body>
        {/* Render your toast UI BEFORE FlashToastEffect — see source-order rule. */}
        <Toaster />
        <FlashToastEffect
          toast={flashToast}
          notify={(t) => sonner[t.type](t.message, t)}
        />
        <Outlet />
      </body>
    </html>
  )
}
```

`consumeFlashToastFn` is a server fn (the RPC seam — TSS's import-protection plugin won't let your client-bundled `__root.tsx` import server-only code directly).

---

## Source-order rule (read this)

**Render your toast UI's `<Toaster>` (sonner / react-toastify / your own component) BEFORE `<FlashToastEffect />` in the JSX tree.** React commits sibling effects in source order; if `<FlashToastEffect />` fires its `notify(...)` before `<Toaster>` has subscribed, the toast disappears silently.

```tsx
// ✅ Correct
<Toaster />
<FlashToastEffect toast={flashToast} notify={notify} />

// ❌ Silent drop — toast UI hasn't subscribed when notify fires
<FlashToastEffect toast={flashToast} notify={notify} />
<Toaster />
```

This is universal to any subscribe-on-mount toast UI (sonner, react-toastify, sonner-react, custom). Tracked in sonner #168, #341, #723; shadcn-ui #2175. The fix is one rule of thumb. Get it wrong and the symptom is "cookie reads correctly, no toast appears" — easy to miss, easy to fix.

---

## Recipes

### Stage and redirect (most common)

```ts
// In a server fn or beforeLoad:
import { redirectWithSuccess } from '@tanstack/react-start-toast'

await redirectWithSuccess('/dashboard', 'Logged in!')
// Promise<never> — code after this is unreachable
```

### Stage a toast without redirecting

```ts
import { setFlashToast } from '@tanstack/react-start-toast'

await setFlashToast({
  type: 'success',
  message: 'Saved',
  description: 'Changes are live',
  duration: 6000,
})
return data // your normal return value
```

### Replace history instead of pushing (post-mutation)

```ts
import { replaceWithSuccess } from '@tanstack/react-start-toast'

// Same as redirectWithSuccess but uses `replace: true` so the back
// button doesn't re-trigger the form submission.
await replaceWithSuccess('/posts/123', 'Post created')
```

### Customize the cookie

```ts
setFlashCookieOptions({
  secret: process.env.SESSION_SECRET,
  name: 'my-flash',
  maxAge: 30,
  sameSite: 'strict',
})
```

---

## API

All exports are re-exported from `@tanstack/react-start-toast`.

### Configuration

| Export                  | Signature                            | Notes                                                          |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------- |
| `setFlashCookieOptions` | `(opts: FlashCookieOptions) => void` | Call once at boot. Throws if used without a secret configured. |

### Primitives

| Export                | Signature                                                                 | Notes                                             |
| --------------------- | ------------------------------------------------------------------------- | ------------------------------------------------- |
| `setFlashToast`       | `(input: FlashToastInput, defaultType?: FlashToastType) => Promise<void>` | Stage a toast. Last write wins.                   |
| `consumeFlashToast`   | `() => Promise<FlashToast \| null>`                                       | Read + clear. Server-side only.                   |
| `consumeFlashToastFn` | `() => Promise<FlashToast \| null>`                                       | Server-fn wrapper. Use in client-bundled loaders. |

### Redirect helpers (push history)

| Export                | Signature                                                  |
| --------------------- | ---------------------------------------------------------- |
| `redirectWithToast`   | `(href: string, input: FlashToastInput) => Promise<never>` |
| `redirectWithSuccess` | `(href: string, input: FlashToastInput) => Promise<never>` |
| `redirectWithError`   | `(href: string, input: FlashToastInput) => Promise<never>` |
| `redirectWithInfo`    | `(href: string, input: FlashToastInput) => Promise<never>` |
| `redirectWithWarning` | `(href: string, input: FlashToastInput) => Promise<never>` |

### Replace helpers (no history entry)

| Export               | Signature                                                  |
| -------------------- | ---------------------------------------------------------- |
| `replaceWithToast`   | `(href: string, input: FlashToastInput) => Promise<never>` |
| `replaceWithSuccess` | `(href: string, input: FlashToastInput) => Promise<never>` |
| `replaceWithError`   | `(href: string, input: FlashToastInput) => Promise<never>` |
| `replaceWithInfo`    | `(href: string, input: FlashToastInput) => Promise<never>` |
| `replaceWithWarning` | `(href: string, input: FlashToastInput) => Promise<never>` |

### Renderer

| Export               | Props                                                                |
| -------------------- | -------------------------------------------------------------------- |
| `<FlashToastEffect>` | `{ toast: FlashToast \| null; notify: (toast: FlashToast) => void }` |

### Types

```ts
type FlashToastType = 'info' | 'success' | 'error' | 'warning'

interface FlashToast {
  message: string
  type: FlashToastType
  description?: string
  duration?: number
  _id: string
}

type FlashToastInput =
  | string
  | (Omit<FlashToast, '_id' | 'type'> & { type?: FlashToastType })
```

---

## Migration from remix-toast

Most exports map 1:1. The differences:

| remix-toast                                  | start-toast                                            | Notes                                                                                                                     |
| -------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `setToast(context, toast)` (middleware mode) | `await setFlashToast(input, defaultType?)`             | TSS uses h3 cookies via AsyncLocalStorage — no explicit `context` arg.                                                    |
| `getToast(request)`                          | `await consumeFlashToast()` (or `consumeFlashToastFn`) | Always returns `FlashToast \| null`, always clears. No headers to thread through.                                         |
| `redirectWithToast(url, toast)`              | `redirectWithToast(href, input)`                       | Returns `Promise<never>` (TSS throws redirects).                                                                          |
| `redirectWithSuccess` etc. (4)               | Same names                                             | Same signature.                                                                                                           |
| `replaceWithToast` family (5)                | Same names                                             | Same signature.                                                                                                           |
| `setToastCookieOptions(options)`             | `setFlashCookieOptions(options)`                       | Same shape. The TSS version uses `secret: string` instead of RR's `secrets: string[]`.                                    |
| `dataWithToast` family (5)                   | _Not ported._                                          | Unnecessary in TSS — server fns return JSON; cookie writes are independent. Just call `setFlashToast` then `return data`. |
| `unstable_toastMiddleware`                   | _Not ported._                                          | TSS uses `consumeFlashToastFn` from the root loader — same behavior, different mechanism.                                 |
| `createToastUtilsWithCustomSession(session)` | _Not ported._                                          | RR-specific. Configure once globally via `setFlashCookieOptions` instead.                                                 |

---

## Troubleshooting

| Symptom                                                 | Cause                                                                          | Fix                                                                                              |
| ------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Toast doesn't appear                                    | `<FlashToastEffect />` rendered before your toast UI's `<Toaster>`             | Swap order — `<Toaster>` first.                                                                  |
| Toast fires twice on refresh                            | `_id` dedupe expects sessionStorage; private/incognito mode rejects it         | Acceptable — it falls back to "fire once per render". Won't double-fire in normal browsing.      |
| Cookie not clearing                                     | Calling `consumeFlashToast` from a non-server context (mocked or wrong import) | Ensure the call goes through `consumeFlashToastFn` from a server fn / loader.                    |
| Build error: "Refusing to seal with placeholder secret" | `setFlashCookieOptions` not called before any `setFlashToast`                  | Call it at the top of `__root.tsx`.                                                              |
| `consumeFlashToastFn` returns `null` always             | The cookie is sealed with a different secret than the one configured           | Make sure `setFlashCookieOptions({ secret: ... })` runs the same value on both reads and writes. |

---

## Why a separate library?

`remix-toast` doesn't translate to TSS directly:

- React Router exposes a per-request `context` for set/get; TSS uses h3's request-scoped AsyncLocalStorage.
- React Router redirects return a `Response`; TSS redirects throw.
- React Router's `data()` helper returns a `Response` that carries headers; TSS server fns return JSON, with cookies written via the underlying `setCookie`.

The mechanics differ, but the user mental model — "stage a toast on the response, render it on the next page" — is identical. This lib re-implements `remix-toast`'s API surface against TSS's primitives so you can think about it the same way.

The fundamental property: **set and consume use disjoint cookie pipes within a request.** Set writes to the outbound `Set-Cookie` headers; consume reads from the inbound `Cookie` header. They cannot collide, even when route loaders run concurrently. The browser commits the outbound cookie and replays it on the next request.

---

## Related

- [`remix-toast`](https://github.com/code-forge-io/remix-toast) — the original, for React Router
- [`sonner`](https://sonner.emilkowal.ski/) — recommended toast UI for React (we test against it)
- [`@tanstack/react-start`](https://tanstack.com/start) — the framework this lib targets

---

## License

[MIT](./LICENSE)
