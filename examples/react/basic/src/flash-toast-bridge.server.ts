/**
 * Local re-export of the lib's server-only helpers. The `.server.ts`
 * extension activates TanStack Start's import-protection plugin
 * (matches `**\/*.server.*`), which tells Vite to externalize anything
 * imported from this file from the client bundle.
 *
 * Why this matters: the lib's `/server` subpath imports h3
 * (`getCookie`/`setCookie`), which transitively pulls
 * `node:async_hooks`. Importing `/server` directly at the top level of
 * a client-bundled file (route loaders, server-fn modules reachable
 * from the client) survives TSS's compile-time transform and crashes
 * the production build with `node:async_hooks externalized for browser
 * compatibility`.
 *
 * Routing every server-only import through this `.server.ts` choke
 * point lets the rest of your app use top-level `import` statements
 * without any per-call-site dynamic-import ceremony.
 */
export {
  consumeFlashToast,
  redirectWithError,
  redirectWithInfo,
  redirectWithSuccess,
  redirectWithToast,
  redirectWithWarning,
  replaceWithError,
  replaceWithInfo,
  replaceWithSuccess,
  replaceWithToast,
  replaceWithWarning,
  setFlashToast,
} from '@tanstack/react-start-toast/server'
