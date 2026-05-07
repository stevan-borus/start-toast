import { defineConfig, devices } from '@playwright/test'

const PORT = 3000

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'on-first-retry',
  },
  webServer: {
    // Use the production build instead of `pnpm dev` — TSS dev mode is
    // currently broken by upstream version skew between start-server-core
    // and start-plugin-core, which manifests as a Vite import-analysis
    // error overlay that breaks hydration. Production build is unaffected
    // and exercises the same lib code.
    command: 'pnpm build && pnpm start',
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      START_TOAST_SECRET:
        'playwright-test-secret-must-be-at-least-32-chars-long-yes',
      PORT: String(PORT),
    },
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
})
