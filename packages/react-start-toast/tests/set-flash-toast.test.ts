import { describe, it, expect, beforeEach } from 'vitest'
import {
  setCookieMock,
  resetMocks,
  TEST_PASSWORD,
} from './setup'
import { setFlashCookieOptions, setFlashToast } from '../src/index.js'

beforeEach(() => {
  resetMocks()
  setFlashCookieOptions({ secret: TEST_PASSWORD })
})

describe('setFlashToast', () => {
  it('writes a sealed cookie for a string input', async () => {
    await setFlashToast('Hello there')

    expect(setCookieMock).toHaveBeenCalledTimes(1)
    const [name, value] = setCookieMock.mock.calls[0]!
    expect(name).toBe('__start_toast')
    expect(value).toMatch(/^Fe26\.2\*/)
  })

  it('overwrites the existing cookie on a second call (last-write-wins)', async () => {
    await setFlashToast('first')
    await setFlashToast('second')
    expect(setCookieMock).toHaveBeenCalledTimes(2)
  })

  it('honors a custom cookie name set via setFlashCookieOptions', async () => {
    setFlashCookieOptions({ name: 'my-custom-flash' })
    await setFlashToast('Hi')
    expect(setCookieMock.mock.calls[0]![0]).toBe('my-custom-flash')
    setFlashCookieOptions({ name: '__start_toast' }) // reset for other tests
  })
})

