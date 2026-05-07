import { useEffect } from 'react'
import { redirect } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  getCookie as tssGetCookie,
  setCookie as tssSetCookie,
} from '@tanstack/react-start/server'
import {
  makeFlashToastId,
  normalizeFlashInput,
  sealToast,
  unsealToast,
} from '@tanstack/start-toast-core'
import type {
  FlashToast,
  FlashToastInput,
  FlashToastType,
} from '@tanstack/start-toast-core'

export type {
  FlashToast,
  FlashToastInput,
  FlashToastType,
} from '@tanstack/start-toast-core'

/**
 * Mutable per-app config for the flash cookie. Mirrors `remix-toast`'s
 * `setToastCookieOptions` shape — a single setter that applies to every
 * subsequent helper call. `secret` is required in production; the lib will
 * throw on first use if the placeholder default is still in place.
 */
export interface FlashCookieOptions {
  /** Secret used to seal/unseal the cookie. Must be ≥32 characters. */
  secret?: string
  /** Cookie name. Defaults to `__start_toast`. */
  name?: string
  /** Max-Age in seconds. Defaults to 60. */
  maxAge?: number
  /** Cookie path. Defaults to `/`. */
  path?: string
  /** SameSite policy. Defaults to `lax`. */
  sameSite?: 'lax' | 'strict' | 'none'
  /** Whether to set Secure. Defaults to `process.env.NODE_ENV === 'production'`. */
  secure?: boolean
  /** Whether to set HttpOnly. Defaults to `true`. */
  httpOnly?: boolean
}

const PLACEHOLDER_SECRET = 'CHANGE-ME-set-via-setFlashCookieOptions-please-do!!'

const config: Required<FlashCookieOptions> = {
  secret: PLACEHOLDER_SECRET,
  name: '__start_toast',
  maxAge: 60,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
}

/**
 * Override the flash cookie config. Call once during server boot. Mirrors
 * `remix-toast`'s `setToastCookieOptions(options)` API.
 */
export function setFlashCookieOptions(opts: FlashCookieOptions): void {
  Object.assign(config, opts)
}

function ensureSecret(): string {
  if (config.secret === PLACEHOLDER_SECRET) {
    throw new Error(
      '[@tanstack/react-start-toast] Refusing to seal a flash toast with the placeholder secret. ' +
        'Call setFlashCookieOptions({ secret: process.env.SESSION_SECRET }) at server boot.',
    )
  }
  return config.secret
}

function cookieAttrs(maxAge: number): {
  path: string
  httpOnly: boolean
  sameSite: 'lax' | 'strict' | 'none'
  secure: boolean
  maxAge: number
} {
  return {
    path: config.path,
    httpOnly: config.httpOnly,
    sameSite: config.sameSite,
    secure: config.secure,
    maxAge,
  }
}

/**
 * Stage a toast on the response cookie. Call from a server-side context
 * (loader, server fn, route `beforeLoad`) immediately before
 * `throw redirect()`. Multiple calls in the same response: last write
 * wins (matches `remix-toast`'s semantics).
 */
export async function setFlashToast(
  input: FlashToastInput,
  defaultType: FlashToastType = 'info',
): Promise<void> {
  const password = ensureSecret()
  const normalized = normalizeFlashInput(input, defaultType)
  const toast: FlashToast = { ...normalized, _id: makeFlashToastId() }
  const sealed = await sealToast(toast, password)
  tssSetCookie(config.name, sealed, cookieAttrs(config.maxAge))
}

/**
 * Read + clear the staged flash toast. Returns null if nothing is staged or
 * the cookie failed to verify. The clear is staged unconditionally so a
 * corrupt cookie is dropped rather than persisted across requests.
 *
 * Reads use the inbound Cookie header; writes use the outbound Set-Cookie
 * response header — the two pipes are disjoint, so concurrent
 * `setFlashToast`/`consumeFlashToast` in the same request cannot collide.
 */
export async function consumeFlashToast(): Promise<FlashToast | null> {
  const sealed = tssGetCookie(config.name)
  if (!sealed) return null
  const password = ensureSecret()
  const toast = await unsealToast(sealed, password)
  tssSetCookie(config.name, '', cookieAttrs(0))
  return toast
}

/**
 * Server-fn wrapper around `consumeFlashToast`. The RPC seam route loaders
 * use because they live in client-bundled `.tsx` files — TSS's
 * import-protection plugin rejects direct server-only imports from those.
 *
 * Wire it from your `__root.tsx` loader:
 *
 * ```ts
 * export const Route = createRootRoute({
 *   loader: async () => ({ flashToast: await consumeFlashToastFn() }),
 *   component: RootComponent,
 * })
 * ```
 */
export const consumeFlashToastFn = createServerFn({ method: 'POST' }).handler(
  async (): Promise<FlashToast | null> => consumeFlashToast(),
)

/**
 * Stage a flash toast and throw a TanStack Router redirect to `href` in
 * one call. Returns `Promise<never>` so TS knows code after the call is
 * unreachable. Mirrors `remix-toast`'s `redirectWithToast(url, toast)`,
 * adapted for TSS's throw-based redirect model.
 */
export async function redirectWithToast(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'info')
  throw redirect({ href, throw: true })
}

export async function redirectWithSuccess(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'success')
  throw redirect({ href, throw: true })
}

export async function redirectWithError(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'error')
  throw redirect({ href, throw: true })
}

export async function redirectWithInfo(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'info')
  throw redirect({ href, throw: true })
}

export async function redirectWithWarning(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'warning')
  throw redirect({ href, throw: true })
}

/**
 * Stage a flash toast and replace the current history entry with `href`.
 * Same semantics as `redirectWith*` but uses `replace: true` so the back
 * button doesn't return to the current URL — useful after form mutations
 * where re-submitting on back would be wrong. Mirrors `remix-toast`'s
 * `replaceWithToast` family.
 */
export async function replaceWithToast(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'info')
  throw redirect({ href, throw: true, replace: true })
}

export async function replaceWithSuccess(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'success')
  throw redirect({ href, throw: true, replace: true })
}

export async function replaceWithError(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'error')
  throw redirect({ href, throw: true, replace: true })
}

export async function replaceWithInfo(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'info')
  throw redirect({ href, throw: true, replace: true })
}

export async function replaceWithWarning(
  href: string,
  input: FlashToastInput,
): Promise<never> {
  await setFlashToast(input, 'warning')
  throw redirect({ href, throw: true, replace: true })
}

const DEDUPE_STORAGE_KEY = '@tanstack/react-start-toast:fired'

interface FlashToastEffectProps {
  /** The toast surfaced by your root loader, or `null` when none is staged. */
  toast: FlashToast | null
  /**
   * Callback that hands the toast to your toast UI. Typical bindings:
   * `(t) => sonner[t.type](t.message, t)` for sonner; `(t) => toast(t.message)`
   * for react-toastify; or your own component imperative API.
   *
   * **Source-order constraint:** if your toast UI subscribes lazily (sonner,
   * react-toastify, etc.), render its `<Toaster>` BEFORE this component in
   * your JSX tree. React commits sibling effects in source order, so this
   * component's `notify(...)` would otherwise fire before any subscriber
   * exists and the toast would be silently dropped.
   */
  notify: (toast: FlashToast) => void
}

/**
 * Drop-in renderer that fires loader-surfaced flash toasts through any toast
 * UI. Effect-only — renders nothing. Dedupes by `_id` via sessionStorage so
 * the same toast never re-fires across re-renders, hydration, or
 * within-TTL refreshes.
 */
export function FlashToastEffect({
  toast,
  notify,
}: FlashToastEffectProps): null {
  useEffect(() => {
    if (!toast) return
    if (typeof window === 'undefined') return
    try {
      const fired = window.sessionStorage.getItem(DEDUPE_STORAGE_KEY)
      if (fired === toast._id) return
      window.sessionStorage.setItem(DEDUPE_STORAGE_KEY, toast._id)
    } catch {
      // sessionStorage can throw in incognito or quota-exceeded. Better to
      // re-fire than to drop silently.
    }
    notify(toast)
  }, [toast, notify])
  return null
}

