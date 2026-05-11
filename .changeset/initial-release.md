---
"react-start-toast": minor
---

Initial release. Server-set toast notifications for TanStack Start: a 1:1 adaptation of `remix-toast` for TSS's server-fn / cookie-bridge model. Exports `setFlashToast`, `consumeFlashToast`, `redirectWith*`, `replaceWith*`, `setFlashCookieOptions` from `react-start-toast/server`, and `ToastProvider` + `FlashToastEffect` from `react-start-toast`. Bring your own toast UI; the lib is headless.
