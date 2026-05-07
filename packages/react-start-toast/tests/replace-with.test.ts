import { describe, it, expect, beforeEach } from 'vitest'
import { unsealToast } from '@tanstack/start-toast-core'
import {
  setCookieMock,
  redirectMock,
  resetMocks,
  TEST_PASSWORD,
} from './setup'
import {
  replaceWithToast,
  replaceWithSuccess,
  replaceWithError,
  replaceWithInfo,
  replaceWithWarning,
  setFlashCookieOptions,
} from '../src/server.js'

beforeEach(() => {
  resetMocks()
  setFlashCookieOptions({ secret: TEST_PASSWORD })
})

describe('replaceWith* helpers', () => {
  it.each([
    ['replaceWithToast', () => replaceWithToast('/login', 'hi')],
    ['replaceWithSuccess', () => replaceWithSuccess('/profile', 'Saved')],
    ['replaceWithError', () => replaceWithError('/login', 'Boom')],
    ['replaceWithInfo', () => replaceWithInfo('/login', 'FYI')],
    ['replaceWithWarning', () => replaceWithWarning('/login', 'Heads up')],
  ])(
    '%s stages the cookie then throws a TSS redirect with replace: true',
    async (_name, run) => {
      await expect(run()).rejects.toMatchObject({ __redirect: true })

      expect(setCookieMock).toHaveBeenCalledTimes(1)
      expect(setCookieMock.mock.calls[0]![0]).toBe('__start_toast')
      expect(setCookieMock.mock.calls[0]![1]).toMatch(/^Fe26\.2\*/)
      expect(redirectMock).toHaveBeenCalledTimes(1)
      expect(redirectMock.mock.calls[0]![0]).toMatchObject({ replace: true })
    },
  )

  it('accepts a string OR a {message, description, duration} input', async () => {
    await expect(
      replaceWithSuccess('/x', {
        message: 'Done',
        description: 'Your post is live',
        duration: 6000,
      }),
    ).rejects.toMatchObject({ __redirect: true })

    expect(setCookieMock).toHaveBeenCalledTimes(1)
    expect(redirectMock).toHaveBeenCalledTimes(1)
    expect(redirectMock.mock.calls[0]![0]).toMatchObject({ replace: true })
  })

  it.each([
    ['replaceWithSuccess', () => replaceWithSuccess('/x', 'm'), 'success'],
    ['replaceWithError', () => replaceWithError('/x', 'm'), 'error'],
    ['replaceWithInfo', () => replaceWithInfo('/x', 'm'), 'info'],
    ['replaceWithWarning', () => replaceWithWarning('/x', 'm'), 'warning'],
    [
      'replaceWithToast (default info)',
      () => replaceWithToast('/x', 'm'),
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
})
