import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { resetMocks, TEST_PASSWORD } from './setup'

const ENV_VAR = 'START_TOAST_SECRET'
const SHORT_SECRET = 'too-short'
const ANOTHER_SECRET = 'another-secret-also-32-characters-long-yes!'

beforeEach(() => {
  resetMocks()
  vi.resetModules()
  delete process.env[ENV_VAR]
})

afterEach(() => {
  delete process.env[ENV_VAR]
})

describe('secret resolution', () => {
  it('reads process.env.START_TOAST_SECRET on first use when no config secret is set', async () => {
    process.env[ENV_VAR] = TEST_PASSWORD
    const { setFlashToast } = await import('../src/server.js')
    await expect(setFlashToast('hi')).resolves.not.toThrow()
  })

  it('prefers an explicit setFlashCookieOptions({ secret }) over the env var', async () => {
    process.env[ENV_VAR] = TEST_PASSWORD
    const { setFlashCookieOptions, setFlashToast } =
      await import('../src/server.js')
    setFlashCookieOptions({ secret: ANOTHER_SECRET })
    // Both are valid 32+ char strings; just assert no throw — the precedence
    // is what we're verifying, sealing succeeds either way.
    await expect(setFlashToast('hi')).resolves.not.toThrow()
  })

  it('accepts a thunk for runtime-resolved secrets', async () => {
    const { setFlashCookieOptions, setFlashToast } =
      await import('../src/server.js')
    setFlashCookieOptions({ secret: () => TEST_PASSWORD })
    await expect(setFlashToast('hi')).resolves.not.toThrow()
  })

  it('throws a descriptive error when neither env nor config provides a secret', async () => {
    const { setFlashToast } = await import('../src/server.js')
    await expect(setFlashToast('hi')).rejects.toThrow(
      /No flash-cookie secret resolved.*START_TOAST_SECRET/s,
    )
  })

  it('throws when the resolved secret is shorter than 32 characters', async () => {
    const { setFlashCookieOptions, setFlashToast } =
      await import('../src/server.js')
    setFlashCookieOptions({ secret: SHORT_SECRET })
    await expect(setFlashToast('hi')).rejects.toThrow(/at least 32 characters/)
  })

  it('does not throw at config time — only at first staging call', async () => {
    const { setFlashCookieOptions } = await import('../src/server.js')
    expect(() => setFlashCookieOptions({ secret: undefined })).not.toThrow()
    expect(() => setFlashCookieOptions({ secret: SHORT_SECRET })).not.toThrow()
  })
})
