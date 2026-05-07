import { redirect } from '@tanstack/react-router'
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
 * Server-only. Call from a server-bundled module (server fn, root server
 * entry, `*.server.ts`). Importing this from a client-bundled file fails at
 * build time — TanStack Start's import-protection plugin rejects the
 * `/server` subpath.
 *
 * @example
 * ```ts
 * setFlashCookieOptions({ name: 'my-flash', maxAge: 30 })
 * setFlashCookieOptions({ secret: () => vault.read('flash-secret') })
 * ```
 */
export function setFlashCookieOptions(opts: FlashCookieOptions): void {
  if (opts.secret !== undefined) config.secret = opts.secret
  if (opts.name !== undefined) config.name = opts.name
  if (opts.maxAge !== undefined) config.maxAge = opts.maxAge
  if (opts.path !== undefined) config.path = opts.path
  if (opts.sameSite !== undefined) config.sameSite = opts.sameSite
  if (opts.secure !== undefined) config.secure = opts.secure
  if (opts.httpOnly !== undefined) config.httpOnly = opts.httpOnly
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
