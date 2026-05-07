import { vi } from 'vitest'

export const cookieStore = new Map<string, string>()

export const setCookieMock = vi.fn(
  (name: string, value: string, opts?: { maxAge?: number }) => {
    if (opts?.maxAge === 0) cookieStore.delete(name)
    else cookieStore.set(name, value)
  },
)

export const getCookieMock = vi.fn((name: string) => cookieStore.get(name))

export const redirectMock = vi.fn((opts: { href: string; throw: boolean }) => {
  const err = new Error('Redirect') as Error & {
    __redirect: true
    href: string
  }
  err.__redirect = true
  err.href = opts.href
  return err
})

vi.mock('@tanstack/react-start/server', () => ({
  setCookie: (...args: Parameters<typeof setCookieMock>) =>
    setCookieMock(...args),
  getCookie: (name: string) => getCookieMock(name),
}))

vi.mock('@tanstack/react-start', () => ({
  createServerFn: () => ({}),
}))

vi.mock('@tanstack/react-router', () => ({
  redirect: (opts: { href: string; throw: boolean }) => redirectMock(opts),
}))

export const TEST_PASSWORD =
  'test-password-must-be-at-least-32-characters-long-yes'

export function resetMocks(): void {
  cookieStore.clear()
  setCookieMock.mockClear()
  getCookieMock.mockClear()
  redirectMock.mockClear()
}
