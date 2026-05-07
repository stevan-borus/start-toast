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
import type { ReactNode } from 'react'
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

/** Per-app config for the flash cookie. Override defaults via `setFlashCookieOptions`. */
export interface FlashCookieOptions {
  /**
   * Secret used to seal/unseal the cookie. Must be ≥32 characters.
   * If omitted, the lib reads `process.env.START_TOAST_SECRET` on first
   * use. Pass a function for runtime-resolved secrets (Vault, AWS Secrets
   * Manager, etc.).
   */
  secret?: string | (() => string | undefined)
  /** Cookie name. Defaults to `__start_toast`. */
  name?: string
  /** Max-Age in seconds. Defaults to `60`. */
  maxAge?: number
  /** Cookie path. Defaults to `/`. */
  path?: string
  /** SameSite policy. Defaults to `lax`. */
  sameSite?: 'lax' | 'strict' | 'none'
  /** Whether to set `Secure`. Defaults to `process.env.NODE_ENV === 'production'`. */
  secure?: boolean
  /** Whether to set `HttpOnly`. Defaults to `true`. */
  httpOnly?: boolean
}

const ENV_VAR = 'START_TOAST_SECRET'
const PLACEHOLDER_SECRET = 'CHANGE-ME-set-via-setFlashCookieOptions-please-do!!'

interface InternalConfig {
  secret: string | (() => string | undefined) | undefined
  name: string
  maxAge: number
  path: string
  sameSite: 'lax' | 'strict' | 'none'
  secure: boolean
  httpOnly: boolean
}

const config: InternalConfig = {
  secret: undefined, // resolved lazily — see resolveSecret()
  name: '__start_toast',
  maxAge: 60,
  path: '/',
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
}

/**
 * Configure the flash cookie. The lib works without calling this — set
 * `START_TOAST_SECRET` in your server environment and you're done. Reach
 * for this when you need a custom cookie name, runtime-resolved secrets,
 * or different defaults.
 *
 * Safe to call from a module bundled in both client and server contexts:
 * `undefined` values are skipped, so a client-side call where an env var
 * resolves to `undefined` won't clobber the server-set value.
 *
 * @example
 * ```ts
 * setFlashCookieOptions({ name: 'my-flash', maxAge: 30 })
 * setFlashCookieOptions({ secret: () => vault.read('flash-secret') })
 * ```
 */
export function setFlashCookieOptions(opts: FlashCookieOptions): void {
  for (const [key, value] of Object.entries(opts)) {
    if (value !== undefined) {
      ;(config as unknown as Record<string, unknown>)[key] = value
    }
  }
}

function resolveSecret(): string {
  // Precedence: explicit setFlashCookieOptions({ secret }) > env var > throw.
  const fromConfig =
    typeof config.secret === 'function' ? config.secret() : config.secret
  const resolved = fromConfig ?? process.env[ENV_VAR]

  if (!resolved || resolved === PLACEHOLDER_SECRET) {
    throw new Error(
      `[@tanstack/react-start-toast] No flash-cookie secret resolved. ` +
        `Set ${ENV_VAR} in your server environment, or call ` +
        `setFlashCookieOptions({ secret }) before any flash-toast call.`,
    )
  }
  if (resolved.length < 32) {
    throw new Error(
      `[@tanstack/react-start-toast] Flash-cookie secret must be at least 32 characters.`,
    )
  }
  return resolved
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
 * (loader, server fn, `beforeLoad`) immediately before `throw redirect()`.
 * Multiple calls in the same response: last write wins.
 */
export async function setFlashToast(
  input: FlashToastInput,
  defaultType: FlashToastType = 'info',
): Promise<void> {
  const password = resolveSecret()
  const normalized = normalizeFlashInput(input, defaultType)
  const toast: FlashToast = { ...normalized, _id: makeFlashToastId() }
  const sealed = await sealToast(toast, password)
  tssSetCookie(config.name, sealed, cookieAttrs(config.maxAge))
}

/**
 * Read + clear the staged flash toast. Returns `null` if nothing is staged
 * or the cookie failed to verify. The clear is staged unconditionally so a
 * corrupt cookie is dropped rather than persisted across requests.
 */
export async function consumeFlashToast(): Promise<FlashToast | null> {
  const sealed = tssGetCookie(config.name)
  if (!sealed) return null
  const password = resolveSecret()
  const toast = await unsealToast(sealed, password)
  tssSetCookie(config.name, '', cookieAttrs(0))
  return toast
}

/**
 * Server-fn wrapper around `consumeFlashToast`, callable from
 * client-bundled root loaders.
 *
 * @example
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
 * one call. The `Promise<never>` return type lets TypeScript infer that
 * code after the call is unreachable.
 *
 * @example
 * ```ts
 * await redirectWithSuccess('/dashboard', 'Logged in!')
 * ```
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
 * Same as `redirectWith*` but uses `replace: true` so the back button
 * doesn't return to the current URL — useful after form mutations where
 * re-submitting on back would be wrong.
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
   * Callback that hands the toast to your toast UI.
   *
   * **Source-order constraint:** if your toast UI subscribes lazily, render
   * its `<Toaster>` BEFORE this component in the JSX tree. React commits
   * sibling effects in source order; if `notify` fires before any
   * subscriber has mounted, the toast is silently dropped. Use
   * `<ToastProvider>` to avoid this.
   */
  notify: (toast: FlashToast) => void
}

/**
 * Effect-only renderer that fires loader-surfaced flash toasts through any
 * toast UI. Renders nothing. Dedupes by `_id` via `sessionStorage` so the
 * same toast never re-fires across re-renders, hydration, or within-TTL
 * refreshes.
 *
 * Reach for `<ToastProvider>` if you want the source-order rule baked in.
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

interface ToastProviderProps {
  /** Your toast UI's renderer node. Mounted first so the lazy subscriber is ready before `notify` fires. */
  toaster: ReactNode
  /** The toast surfaced by your root loader, or `null` when none is staged. */
  toast: FlashToast | null
  /** Callback that hands the toast to your toast UI. */
  notify: (toast: FlashToast) => void
  children?: ReactNode
}

/**
 * Composes the toast UI's renderer + `<FlashToastEffect />` in the correct
 * source order so the source-order footgun cannot misfire. Use this for the
 * safe default; reach for `<FlashToastEffect />` directly when you need
 * explicit control over where each piece sits in the tree.
 *
 * @example
 * ```tsx
 * <ToastProvider
 *   toaster={<Toaster />}
 *   toast={loaderData.flashToast}
 *   notify={(t) => toast[t.type](t.message, t)}
 * >
 *   <Outlet />
 * </ToastProvider>
 * ```
 */
export function ToastProvider({
  toaster,
  toast,
  notify,
  children,
}: ToastProviderProps) {
  return (
    <>
      {toaster}
      <FlashToastEffect toast={toast} notify={notify} />
      {children}
    </>
  )
}

