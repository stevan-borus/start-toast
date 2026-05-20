import { describe, it, expect, beforeEach } from 'vitest'
import { unsealToast } from 'start-toast-core'
import { setCookieMock, redirectMock, resetMocks, TEST_PASSWORD } from './setup'
import {
  redirectWithToast,
  redirectWithSuccess,
  redirectWithError,
  redirectWithInfo,
  redirectWithWarning,
  setFlashCookieOptions,
} from '../src/server.js'

beforeEach(() => {
  resetMocks()
  setFlashCookieOptions({ secret: TEST_PASSWORD })
})

describe('redirectWith* helpers', () => {
  it.each([
    ['redirectWithToast', () => redirectWithToast('/login', 'hi')],
    ['redirectWithSuccess', () => redirectWithSuccess('/profile', 'Saved')],
    ['redirectWithError', () => redirectWithError('/login', 'Boom')],
    ['redirectWithInfo', () => redirectWithInfo('/login', 'FYI')],
    ['redirectWithWarning', () => redirectWithWarning('/login', 'Heads up')],
  ])('%s stages the cookie then throws a TSS redirect', async (_name, run) => {
    await expect(run()).rejects.toMatchObject({ __redirect: true })

    expect(setCookieMock).toHaveBeenCalledTimes(1)
    expect(setCookieMock.mock.calls[0]![0]).toBe('__start_toast')
    expect(setCookieMock.mock.calls[0]![1]).toMatch(/^Fe26\.2\*/)
    expect(redirectMock).toHaveBeenCalledTimes(1)
  })

  it('accepts a string OR a {message, description, duration} input', async () => {
    await expect(
      redirectWithSuccess('/x', {
        message: 'Done',
        description: 'Your post is live',
        duration: 6000,
      }),
    ).rejects.toMatchObject({ __redirect: true })

    expect(setCookieMock).toHaveBeenCalledTimes(1)
    expect(redirectMock).toHaveBeenCalledTimes(1)
  })

  // Without unsealing the cookie value, a refactor that collapsed every
  // helper to `setFlashToast(input, 'info')` would leave the prefix-only
  // assertions above green. Lock the type each variant writes.
  it.each([
    ['redirectWithSuccess', () => redirectWithSuccess('/x', 'm'), 'success'],
    ['redirectWithError', () => redirectWithError('/x', 'm'), 'error'],
    ['redirectWithInfo', () => redirectWithInfo('/x', 'm'), 'info'],
    ['redirectWithWarning', () => redirectWithWarning('/x', 'm'), 'warning'],
    [
      'redirectWithToast (default info)',
      () => redirectWithToast('/x', 'm'),
      'info',
    ],
  ] as const)(
    '%s seals the correct type into the cookie',
    async (_name, run, expectedType) => {
      await expect(run()).rejects.toMatchObject({ __redirect: true })

      const sealed = setCookieMock.mock.calls[0]![1]
      const unsealed = await unsealToast(sealed, TEST_PASSWORD)
      expect(unsealed?.type).toBe(expectedType)
    },
  )

  it('explicit type on the input object overrides the helper default', async () => {
    // redirectWithToast defaults to 'info' but caller passed type:'error'.
    // Mirrors the conditional-toast pattern (`setFlashToast(toast, toast.type)`)
    // a wrapper might use when the type is data-driven.
    await expect(
      redirectWithToast('/x', { message: 'm', type: 'error' }),
    ).rejects.toMatchObject({ __redirect: true })

    const sealed = setCookieMock.mock.calls[0]![1]
    const unsealed = await unsealToast(sealed, TEST_PASSWORD)
    expect(unsealed?.type).toBe('error')
  })
})
