import { createServerFn } from '@tanstack/react-start'
import {
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
} from './flash-toast-bridge.server'

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
    switch (data.type) {
      case 'redirect-success':
        return redirectWithSuccess('/redirected', 'Saved your preferences')
      case 'redirect-error':
        return redirectWithError('/redirected', 'Something went wrong')
      case 'redirect-info':
        return redirectWithInfo('/redirected', 'FYI: maintenance window 9pm')
      case 'redirect-warning':
        return redirectWithWarning('/redirected', 'Heads up — unsaved changes')
      case 'redirect-generic':
        return redirectWithToast('/redirected', {
          message: 'Generic toast',
          description: 'Defaults to type=info',
          duration: 4000,
        })
      case 'replace-success':
        return replaceWithSuccess('/redirected', 'Replaced + success')
      case 'replace-error':
        return replaceWithError('/redirected', 'Replaced + error')
      case 'replace-info':
        return replaceWithInfo('/redirected', 'Replaced + info')
      case 'replace-warning':
        return replaceWithWarning('/redirected', 'Replaced + warning')
      case 'replace-generic':
        return replaceWithToast('/redirected', {
          message: 'Replaced + generic',
          description: 'Defaults to type=info, no history entry',
          duration: 4000,
        })
    }
  })
