import type {
  FlashToast as CoreFlashToast,
  FlashToastInput as CoreFlashToastInput,
  FlashToastType as CoreFlashToastType,
} from 'start-toast-core'

export type FlashToastType = 'info' | 'success' | 'error' | 'warning'

export interface FlashToast {
  message: string
  type: FlashToastType
  description?: string
  duration?: number
  _id: string
}

export type FlashToastInput =
  | string
  | (Omit<FlashToast, '_id' | 'type'> & { type?: FlashToastType })

// Compile-time guard: keep these public types structurally identical to
// core's runtime-derived types. Re-exporting from `start-toast-core` directly
// would be cleaner, but rolldown-plugin-dts can't resolve the cross-package
// re-export when core is bundled via `noExternal`, so we redeclare here and
// let the typechecker catch drift.
type _AssertFlashToastMatches = [
  CoreFlashToast extends FlashToast ? true : false,
  FlashToast extends CoreFlashToast ? true : false,
  CoreFlashToastInput extends FlashToastInput ? true : false,
  FlashToastInput extends CoreFlashToastInput ? true : false,
  CoreFlashToastType extends FlashToastType ? true : false,
  FlashToastType extends CoreFlashToastType ? true : false,
]
const _assertFlashToastMatches: _AssertFlashToastMatches = [
  true,
  true,
  true,
  true,
  true,
  true,
]
void _assertFlashToastMatches
