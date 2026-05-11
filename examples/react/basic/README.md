# `react-start-toast` — basic example

Minimal TanStack Start app demonstrating the lib end-to-end:

- `__root.tsx` calls `consumeFlashToastFn()` in its loader and renders `<FlashToastEffect />`
- `index.tsx` exposes 5 buttons, each calling a server fn that uses one of the `redirectWith*` helpers
- `redirected.tsx` is the target page where the toast fires once

```bash
pnpm install
pnpm --filter @tanstack-start-toast/example-basic dev
# open http://localhost:3000
```

The `notify` callback in this example appends rows to a `#toast-feed` div so the flow is
visible without a toast UI dependency. In a real app you'd replace it with sonner /
react-toastify / your own component.
