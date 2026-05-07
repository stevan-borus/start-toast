# @tanstack/start-toast-core

Framework-agnostic primitives for server-set flash toasts. The shared core that powers `@tanstack/react-start-toast` (and future Solid / Vue adapters).

```bash
pnpm add @tanstack/start-toast-core
```

This package is rarely used directly — most consumers want **[`@tanstack/react-start-toast`](https://github.com/stevan-borus/start-toast/tree/main/packages/react-start-toast)**, which depends on this transitively.

## Exports

- `flashToastSchema` — zod schema for the wire format
- `FlashToast` / `FlashToastInput` / `FlashToastType` — types
- `sealToast(toast, password)` / `unsealToast(sealed, password)` — iron-webcrypto wrappers
- `normalizeFlashInput(input, defaultType)` — string-or-object → canonical `{ message, type }`
- `makeFlashToastId()` — generate the internal `_id` used by the renderer for sessionStorage dedupe

For the full setup guide and recipes, see the [repo README](https://github.com/stevan-borus/start-toast).

## License

MIT
