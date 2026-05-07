import { describe, it, expect, beforeEach } from 'vitest'
import { sealToast, type FlashToast } from '@tanstack/start-toast-core'
import {
  cookieStore,
  setCookieMock,
  resetMocks,
  TEST_PASSWORD,
} from './setup'
import {
  consumeFlashToast,
  setFlashCookieOptions,
} from '../src/index.js'

beforeEach(() => {
  resetMocks()
  setFlashCookieOptions({ secret: TEST_PASSWORD })
})

describe('consumeFlashToast', () => {
  it('returns null when no cookie is present', async () => {
    const result = await consumeFlashToast()
    expect(result).toBeNull()
    expect(setCookieMock).not.toHaveBeenCalled()
  })

  it('returns the unsealed toast and stages a clearing cookie when present', async () => {
    const toast: FlashToast = {
      type: 'success',
      message: 'Saved',
      _id: 'fixed-id',
    }
    const sealed = await sealToast(toast, TEST_PASSWORD)
    cookieStore.set('__start_toast', sealed)

    const result = await consumeFlashToast()

    expect(result).toEqual(toast)
    expect(setCookieMock).toHaveBeenCalledWith(
      '__start_toast',
      '',
      expect.objectContaining({ maxAge: 0 }),
    )
  })

  it('clears the cookie even if unseal fails (corrupt cookie eviction)', async () => {
    cookieStore.set('__start_toast', 'not-a-real-seal')

    const result = await consumeFlashToast()

    expect(result).toBeNull()
    expect(setCookieMock).toHaveBeenCalledWith(
      '__start_toast',
      '',
      expect.objectContaining({ maxAge: 0 }),
    )
  })
})
