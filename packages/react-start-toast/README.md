# @tanstack/react-start-toast

Server-set toast notifications for [TanStack Start](https://tanstack.com/start). A 1:1 adaptation of [`remix-toast`](https://github.com/code-forge-io/remix-toast) for the TSS server-fn / cookie-bridge model.

```bash
pnpm add @tanstack/react-start-toast
```

## Quick start

```ts
// src/routes/__root.tsx
import {
  consumeFlashToastFn,
  FlashToastEffect,
  setFlashCookieOptions,
} from '@tanstack/react-start-toast'

setFlashCookieOptions({ secret: process.env.SESSION_SECRET })

export const Route = createRootRoute({
  loader: async () => ({ flashToast: await consumeFlashToastFn() }),
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

```ts
// In any server fn:
import { redirectWithSuccess } from '@tanstack/react-start-toast'

await redirectWithSuccess('/dashboard', 'Logged in!')
```

## Source-order rule

> **Render your toast UI BEFORE `<FlashToastEffect />` in your JSX tree.** React commits sibling effects in source order; if `<FlashToastEffect />` fires first, the toast is silently dropped because no subscriber exists yet.

This applies to any subscribe-on-mount toast UI (sonner, react-toastify, custom). Get it right once, never think about it again.

## Full docs

The [repo README](https://github.com/stevan-borus/start-toast) covers:

- Migration guide from `remix-toast`
- Recipes (set + redirect, set without redirect, replace history, custom cookie)
- Full API reference
- Troubleshooting

## Peer dependencies

- `@tanstack/react-router >= 1.167.0`
- `@tanstack/react-start >= 1.167.0`
- `react >= 18`
- `react-dom >= 18`

## License

MIT
