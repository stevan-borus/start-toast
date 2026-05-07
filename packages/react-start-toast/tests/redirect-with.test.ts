import { describe, it, expect, beforeEach } from 'vitest'
import {
  setCookieMock,
  redirectMock,
  resetMocks,
  TEST_PASSWORD,
} from './setup'
import {
  redirectWithToast,
  redirectWithSuccess,
  redirectWithError,
  redirectWithInfo,
  redirectWithWarning,
  setFlashCookieOptions,
} from '../src/index.js'

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
})
