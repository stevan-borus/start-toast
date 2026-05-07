import { createServerFn } from '@tanstack/react-start'

// All server-only imports + the TRIGGERS map live INSIDE the handler, not
// at module top-level. TSS's compiler strips handler bodies (and their
// transitive imports) from the client bundle on a per-server-fn basis.
// Top-level imports stay; handler-body imports are dropped. Hence the
// `await import('@tanstack/react-start-toast/server')` shape — keeps the
// h3-touching code out of the browser entirely.

const TRIGGER_KEYS = [
  'redirect-success',
  'redirect-error',
  'redirect-info',
  'redirect-warning',
  'redirect-generic',
  'replace-success',
  'replace-error',
  'replace-info',
  'replace-warning',
  'replace-generic',
] as const

export type TriggerKey = (typeof TRIGGER_KEYS)[number]

export function isTriggerKey(value: string): value is TriggerKey {
  return (TRIGGER_KEYS as ReadonlyArray<string>).includes(value)
}

export const triggerFn = createServerFn({ method: 'POST' })
  .inputValidator((data: { type: string }) => {
    if (!isTriggerKey(data.type)) {
      throw new Error(`Unknown trigger: ${data.type}`)
    }
    return { type: data.type }
  })
  .handler(async ({ data }) => {
    const lib = await import('@tanstack/react-start-toast/server')
    switch (data.type) {
      case 'redirect-success':
        return lib.redirectWithSuccess('/redirected', 'Saved your preferences')
      case 'redirect-error':
        return lib.redirectWithError('/redirected', 'Something went wrong')
      case 'redirect-info':
        return lib.redirectWithInfo(
          '/redirected',
          'FYI: maintenance window 9pm',
        )
      case 'redirect-warning':
        return lib.redirectWithWarning(
          '/redirected',
          'Heads up — unsaved changes',
        )
      case 'redirect-generic':
        return lib.redirectWithToast('/redirected', {
          message: 'Generic toast',
          description: 'Defaults to type=info',
          duration: 4000,
        })
      case 'replace-success':
        return lib.replaceWithSuccess('/redirected', 'Replaced + success')
      case 'replace-error':
        return lib.replaceWithError('/redirected', 'Replaced + error')
      case 'replace-info':
        return lib.replaceWithInfo('/redirected', 'Replaced + info')
      case 'replace-warning':
        return lib.replaceWithWarning('/redirected', 'Replaced + warning')
      case 'replace-generic':
        return lib.replaceWithToast('/redirected', {
          message: 'Replaced + generic',
          description: 'Defaults to type=info, no history entry',
          duration: 4000,
        })
    }
  })
