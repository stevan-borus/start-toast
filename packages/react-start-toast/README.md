# @tanstack/react-start-toast

Server-set toast notifications for [TanStack Start](https://tanstack.com/start). A 1:1 adaptation of [`remix-toast`](https://github.com/code-forge-io/remix-toast) for the TSS server-fn / cookie-bridge model.

> Status: pre-release. APIs may change before `0.1.0`.

```ts
// In a route loader / server fn:
import { redirectWithSuccess } from '@tanstack/react-start-toast'

await redirectWithSuccess('/dashboard', 'Logged in!')
```

See the [repo README](https://github.com/stevan-borus/start-toast) for the full set-up guide.

## License

MIT
