import { test, expect, type Page } from '@playwright/test'

// Each button on `/` triggers a server fn that ends in
// `redirectWith*('/redirected', ...)` or `replaceWith*('/redirected', ...)`.
// The redirect lands on `/redirected`, the root loader consumes the flash
// cookie via `consumeFlashToastFn`, and `FlashToastEffect` invokes the
// example's `notify` (which appends a `data-testid="toast-row"` to the feed
// with `data-type` set to the toast's type). We assert on that.

async function clickAndExpectToast(
  page: Page,
  testId: string,
  expectedType: 'success' | 'error' | 'info' | 'warning',
  expectedMessage: string,
) {
  // Use a direct page.goto on the trigger href so the redirect happens at
  // the SSR boundary — the destination's __root loader runs on a fresh
  // request and consumes the flash cookie. Client-side <Link> navigation
  // hands the redirect-throw to the router on the client, which navigates
  // without re-running the destination's loader, so the cookie never gets
  // consumed and no toast fires.
  const triggerHref = `/trigger/${testId.replace(/^btn-/, '')}`
  await page.goto(triggerHref)
  await page.waitForURL('**/redirected')

  const row = page.getByTestId('toast-row').last()
  await expect(row).toBeVisible({ timeout: 5_000 })
  await expect(row).toHaveAttribute('data-type', expectedType)
  await expect(row).toContainText(expectedMessage)
}

test.describe('redirectWith* helpers', () => {
  test('redirectWithSuccess fires a success toast on /redirected', async ({
    page,
  }) => {
    await clickAndExpectToast(
      page,
      'btn-redirect-success',
      'success',
      'Saved your preferences',
    )
  })

  test('redirectWithError fires an error toast', async ({ page }) => {
    await clickAndExpectToast(
      page,
      'btn-redirect-error',
      'error',
      'Something went wrong',
    )
  })

  test('redirectWithInfo fires an info toast', async ({ page }) => {
    await clickAndExpectToast(
      page,
      'btn-redirect-info',
      'info',
      'maintenance window',
    )
  })

  test('redirectWithWarning fires a warning toast', async ({ page }) => {
    await clickAndExpectToast(
      page,
      'btn-redirect-warning',
      'warning',
      'unsaved changes',
    )
  })

  test('redirectWithToast (object input, default info) fires an info toast', async ({
    page,
  }) => {
    await clickAndExpectToast(
      page,
      'btn-redirect-generic',
      'info',
      'Generic toast',
    )
  })
})

test.describe('replaceWith* helpers', () => {
  test('replaceWithSuccess fires a success toast', async ({ page }) => {
    await clickAndExpectToast(
      page,
      'btn-replace-success',
      'success',
      'Replaced + success',
    )
  })

  test('replaceWithError fires an error toast', async ({ page }) => {
    await clickAndExpectToast(
      page,
      'btn-replace-error',
      'error',
      'Replaced + error',
    )
  })

  test('replaceWithInfo fires an info toast', async ({ page }) => {
    await clickAndExpectToast(page, 'btn-replace-info', 'info', 'Replaced + info')
  })

  test('replaceWithWarning fires a warning toast', async ({ page }) => {
    await clickAndExpectToast(
      page,
      'btn-replace-warning',
      'warning',
      'Replaced + warning',
    )
  })

  test('replaceWithToast (object input, default info) fires an info toast', async ({
    page,
  }) => {
    await clickAndExpectToast(
      page,
      'btn-replace-generic',
      'info',
      'Replaced + generic',
    )
  })
})

test.describe('cookie clearing semantics', () => {
  test('refreshing /redirected does NOT re-fire the toast (cookie was cleared)', async ({
    page,
  }) => {
    await page.goto('/trigger/redirect-success')
    await page.waitForURL('**/redirected')

    // First toast appeared (wait for the useEffect that appends the row)
    await expect(page.getByTestId('toast-row')).toHaveCount(1, {
      timeout: 5_000,
    })

    // The cookie was cleared server-side on the first read (Max-Age=0), so
    // a reload re-runs the root loader against a request with no flash
    // cookie. `consumeFlashToastFn` returns null, `FlashToastEffect`
    // doesn't fire `notify`, no row gets appended.
    await page.reload()
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(300)
    await expect(page.getByTestId('toast-row')).toHaveCount(0)
  })
})
