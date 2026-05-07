import { createServerFn } from '@tanstack/react-start'
import type { FlashToast } from '@tanstack/react-start-toast'

/**
 * Reads + clears the staged flash toast from the cookie.
 *
 * Note the dynamic `await import(...)` inside the handler — TSS's compiler
 * strips handler bodies (and their transitive imports) from the client
 * bundle, but only what's INSIDE the handler. A top-level
 * `import { consumeFlashToast } from '@tanstack/react-start-toast/server'`
 * would survive the transform and pull h3's AsyncLocalStorage into the
 * browser, crashing hydration. The dynamic import keeps the server-only
 * code purely server-side.
 */
export const consumeFlashToastFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<FlashToast | null> => {
    const { consumeFlashToast } = await import(
      '@tanstack/react-start-toast/server'
    )
    return consumeFlashToast()
  },
)
