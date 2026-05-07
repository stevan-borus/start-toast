import { seal, unseal } from 'iron-webcrypto'
import { z } from 'zod'

/** Wire format for a flash toast on the cookie. */
export const flashToastSchema = z.object({
  message: z.string(),
  type: z.enum(['info', 'success', 'error', 'warning']),
  description: z.string().optional(),
  duration: z.number().int().nonnegative().optional(),
  _id: z.string(),
})

export type FlashToast = z.infer<typeof flashToastSchema>
export type FlashToastType = FlashToast['type']

/** Public input shape — everything except `_id` (assigned at stage time). */
export type FlashToastInput =
  | string
  | (Omit<FlashToast, '_id' | 'type'> & { type?: FlashToastType })

/** Generate the dedupe-key stamped on every staged toast. */
export function makeFlashToastId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

const SEAL_DEFAULTS = {
  encryption: {
    saltBits: 256,
    algorithm: 'aes-256-cbc',
    iterations: 1,
    minPasswordlength: 32,
  },
  integrity: {
    saltBits: 256,
    algorithm: 'sha256',
    iterations: 1,
    minPasswordlength: 32,
  },
  ttl: 0,
  timestampSkewSec: 60,
  localtimeOffsetMsec: 0,
} as const

/** Encrypt + sign a `FlashToast` for storage in a cookie. */
export async function sealToast(
  toast: FlashToast,
  password: string,
): Promise<string> {
  return seal(toast, password, SEAL_DEFAULTS)
}

/**
 * Decrypt + verify a sealed cookie. Returns `null` on any failure mode
 * (malformed, wrong password, expired, schema mismatch) — flash toasts
 * are best-effort and never throw past the caller.
 */
export async function unsealToast(
  sealed: string,
  password: string,
): Promise<FlashToast | null> {
  try {
    const raw = await unseal(sealed, password, SEAL_DEFAULTS)
    const parsed = flashToastSchema.safeParse(raw)
    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

/** Coerce the public input shape to a canonical, `_id`-less toast. */
export function normalizeFlashInput(
  input: FlashToastInput,
  defaultType: FlashToastType,
): Omit<FlashToast, '_id'> {
  if (typeof input === 'string') {
    return { message: input, type: defaultType }
  }
  return { ...input, type: input.type ?? defaultType }
}
