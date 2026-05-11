# react-start-toast

Server-set toast notifications for [TanStack Start](https://tanstack.com/start). React adapter.

```ts
// In a server-fn handler:
const { redirectWithSuccess } = await import(
  'react-start-toast/server'
)
await redirectWithSuccess('/dashboard', 'Logged in!')
```

The lib has two entrypoints:

- `react-start-toast` — client-safe React (`FlashToastEffect`, `ToastProvider`, types)
- `react-start-toast/server` — server-only helpers (`setFlashToast`, `redirectWith*`, `replaceWith*`, …)

See the [repo README](https://github.com/stevan-borus/start-toast) for setup, recipes, the dynamic-import rule, and the source-order constraint.

## License

MIT
