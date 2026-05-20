import { test, expect } from '@playwright/test'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Regression guard: the lib's server-only chain (h3, AsyncLocalStorage,
// node:async_hooks, node:stream) must NEVER appear in the client bundle.
// Any leak crashes hydration with `bl.AsyncLocalStorage is not a constructor`
// in production. The .server.ts re-export pattern (see ../src/flash-
// toast-bridge.server.ts) is what keeps it out, and this test asserts it
// stays that way.
//
// playwright.config.ts runs `pnpm build` in webServer.command before tests
// fire, so .output/public/assets is fresh when this runs.

const CLIENT_BUNDLE_DIR = join(__dirname, '..', '.output', 'public', 'assets')

const FORBIDDEN_TOKENS = [
  // h3's AsyncLocalStorage init — the actual crash signal.
  'AsyncLocalStorage',
  // Lib internal strings that would only land in the client bundle if
  // src/server.ts got pulled in (e.g. via a missed dynamic-import or a
  // top-level import bypassing the .server.ts boundary).
  'No flash-cookie secret resolved',
  'CHANGE-ME-set-via-setFlashCookieOptions',
]

test.describe('client bundle leak guard', () => {
  test('client assets contain no server-only strings', () => {
    if (!existsSync(CLIENT_BUNDLE_DIR)) {
      throw new Error(
        `Expected ${CLIENT_BUNDLE_DIR} to exist after pnpm build. ` +
          `playwright.config.ts webServer.command should run \`pnpm build && pnpm start\`.`,
      )
    }

    const jsFiles = readdirSync(CLIENT_BUNDLE_DIR).filter((f) =>
      f.endsWith('.js'),
    )
    expect(
      jsFiles.length,
      'expected at least one .js file in the client bundle',
    ).toBeGreaterThan(0)

    const leaks: Array<{ file: string; token: string }> = []
    for (const file of jsFiles) {
      const contents = readFileSync(join(CLIENT_BUNDLE_DIR, file), 'utf8')
      for (const token of FORBIDDEN_TOKENS) {
        if (contents.includes(token)) {
          leaks.push({ file, token })
        }
      }
    }

    expect(
      leaks,
      `Found server-only tokens in client bundle. The .server.ts ` +
        `re-export boundary failed somewhere — check that every import of ` +
        `react-start-toast/server goes through a .server.ts ` +
        `file. Leaks: ${JSON.stringify(leaks, null, 2)}`,
    ).toEqual([])
  })
})
