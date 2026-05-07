import { describe, it, expect } from 'vitest'
import { sealToast, unsealToast, type FlashToast } from '../src/index.js'

const TEST_PASSWORD = 'test-password-must-be-at-least-32-characters-long-yes'

describe('sealToast / unsealToast', () => {
  it('round-trips a basic toast', async () => {
    const toast: FlashToast = {
      type: 'error',
      message: 'Boom',
      _id: 'abc',
    }

    const sealed = await sealToast(toast, TEST_PASSWORD)
    expect(sealed).toMatch(/^Fe26\.2\*/)

    const unsealed = await unsealToast(sealed, TEST_PASSWORD)
    expect(unsealed).toEqual(toast)
  })

  it('preserves description and duration when present', async () => {
    const toast: FlashToast = {
      type: 'success',
      message: 'Done',
      description: 'Your post is live',
      duration: 6000,
      _id: 'xyz',
    }
    const sealed = await sealToast(toast, TEST_PASSWORD)
    const unsealed = await unsealToast(sealed, TEST_PASSWORD)
    expect(unsealed).toEqual(toast)
  })

  it('returns null when the sealed payload is malformed', async () => {
    const result = await unsealToast('not-a-real-seal', TEST_PASSWORD)
    expect(result).toBeNull()
  })

  it('returns null when the password is wrong', async () => {
    const toast: FlashToast = { type: 'info', message: 'Hi', _id: '1' }
    const sealed = await sealToast(toast, TEST_PASSWORD)
    const result = await unsealToast(
      sealed,
      'different-password-also-32-characters-long-yes',
    )
    expect(result).toBeNull()
  })

  it('returns null when the unsealed payload fails schema validation', async () => {
    const sealed = await sealToast(
      { not: 'a toast' } as unknown as FlashToast,
      TEST_PASSWORD,
    )
    const result = await unsealToast(sealed, TEST_PASSWORD)
    expect(result).toBeNull()
  })
})
