import { describe, it, expect, beforeEach } from 'vitest'
import { sealToast, type FlashToast } from '@tanstack/start-toast-core'
import {
  cookieStore,
  setCookieMock,
  resetMocks,
  TEST_PASSWORD,
} from './setup'
import {
  consumeFlashToastFn,
  setFlashCookieOptions,
} from '../src/index.js'

beforeEach(() => {
  resetMocks()
  setFlashCookieOptions({ secret: TEST_PASSWORD })
})

describe('consumeFlashToastFn (server-fn)', () => {
  it('reads and clears the cookie when invoked', async () => {
    const toast: FlashToast = {
      type: 'success',
      message: 'Saved',
      _id: 'fn-id',
    }
    cookieStore.set('__start_toast', await sealToast(toast, TEST_PASSWORD))

    const result = await consumeFlashToastFn()

    expect(result).toEqual(toast)
    expect(setCookieMock).toHaveBeenCalledWith(
      '__start_toast',
      '',
      expect.objectContaining({ maxAge: 0 }),
    )
  })

  it('returns null when no cookie is present', async () => {
    const result = await consumeFlashToastFn()
    expect(result).toBeNull()
  })
})
