import { createServerFn } from '@tanstack/react-start'
import type { FlashToast } from 'react-start-toast'
import { consumeFlashToast } from './flash-toast-bridge.server'

/**
 * Reads + clears the staged flash toast from the cookie. Wired by the
 * root loader.
 *
 * The `consumeFlashToast` import is routed through `flash-toast-bridge.server`
 * — that file's `.server.ts` extension trips TanStack Start's import-
 * protection plugin so the lib's server-only chain is externalized from
 * the client bundle. See the bridge file for the full rationale.
 */
export const consumeFlashToastFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<FlashToast | null> => consumeFlashToast(),
)
