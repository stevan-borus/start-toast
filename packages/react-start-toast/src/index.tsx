import { useEffect } from 'react'
import type { ReactNode } from 'react'
import type { FlashToast } from 'start-toast-core'

export type {
  FlashToast,
  FlashToastInput,
  FlashToastType,
} from 'start-toast-core'

const DEDUPE_STORAGE_KEY = 'react-start-toast:fired'

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
