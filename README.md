# start-toast

Server-set toast notifications for [TanStack Start](https://tanstack.com/start). A 1:1 adaptation of [`remix-toast`](https://github.com/code-forge-io/remix-toast) for the TSS server-fn / cookie-bridge model.

> Status: pre-release. APIs may change before `0.1.0`.

## Packages

| Package | Description |
| --- | --- |
| `@tanstack/start-toast-core` | Framework-agnostic primitives: cookie sealing, schema, types. |
| `@tanstack/react-start-toast` | React + TanStack Start adapter: `setFlashToast`, `redirectWithToast`, `<ToastBridgeRenderer />`. |

## Why

Tanstack Start has no flash-toast library. `remix-toast` solves this for React Router but doesn't translate directly — TSS replaces RR's `loader`/`action` headers with server fns and h3 cookies. This lib brings the same ergonomics (`redirectWithSuccess('/done', 'Saved!')`) to TSS.

## Status

Slice 1 (core + react adapter, parity with `remix-toast`'s direct primitives + redirect helpers) is in progress.

## License

MIT
