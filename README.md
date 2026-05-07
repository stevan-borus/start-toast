# start-toast

> Server-set toast notifications for [TanStack Start](https://tanstack.com/start). A 1:1 adaptation of [`remix-toast`](https://github.com/code-forge-io/remix-toast) for TanStack Start's server-fn / cookie-bridge model.

If you've used `remix-toast`, you already know the API — `setFlashToast`, `redirectWithSuccess`, `consumeFlashToast`, etc. — they work the same way. This lib closes the equivalent gap for TanStack Start.

> **Status:** pre-release. APIs may change before `0.1.0`. Not yet on npm — install via `git+https` or as a workspace package.

## Features

- **Headless** — bring your own toast UI (sonner, react-toastify, your own). The lib only fires `notify(toast)` and lets you render the rest.
- **Type-safe** — every export is fully typed; the wire format is a `zod` schema.
- **Server-only at the boundary** — staging helpers are `.server.ts`-protected; the renderer is plain React.
- **Composable** — orthogonal helpers (`setFlashToast`, `redirectWithError`, `<ToastProvider>`) compose inside your own server fns.
- **Footgun-proofed** — `<ToastProvider>` bakes in the source-order rule so subscribe-on-mount toast UIs receive the event.

## Quick taste

Set `START_TOAST_SECRET` in your server environment (≥32 characters) — that's the only setup. Then:

```tsx
// In a server fn / beforeLoad / loader:
import { redirectWithSuccess } from '@tanstack/react-start-toast'

await redirectWithSuccess('/dashboard', 'Logged in!')
```

```tsx
// In __root.tsx:
import {
  consumeFlashToastFn,
  ToastProvider,
} from '@tanstack/react-start-toast'

export const Route = createRootRoute({
  loader: async () => ({ flashToast: await consumeFlashToastFn() }),
  component: () => {
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
  },
})
```

A working end-to-end example lives in [`examples/react/basic`](./examples/react/basic).

## Advanced

`setFlashCookieOptions` overrides any default — cookie name, max-age, the secret itself, or how the secret is resolved (e.g. for runtime stores like Vault).

```ts
import { setFlashCookieOptions } from '@tanstack/react-start-toast'

setFlashCookieOptions({
  name: 'my-flash',
  maxAge: 30,
  secret: () => myVault.read('flash-secret'), // string or thunk
})
```

The secret is resolved lazily on first use; the env var name is `START_TOAST_SECRET`. Precedence: explicit config > env var > throw.

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
