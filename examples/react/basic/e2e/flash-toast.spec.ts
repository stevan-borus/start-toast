import { test, expect, type Page } from '@playwright/test'

// The example app's `/` is a form whose action is `/trigger?type=...`. The
// trigger route's loader calls one of the `redirectWith*` or
// `replaceWith*` helpers, which throws a TSS redirect to `/redirected` with
// the flash cookie staged on the response. The next request (the redirect
// target) replays the cookie, the root loader consumes it via
// `consumeFlashToastFn`, and `FlashToastEffect` appends a row to the
// `toast-feed` div with `data-type` set. We assert on that row.

async function gotoTriggerAndExpectToast(
  page: Page,
  triggerType: string,
  expectedType: 'success' | 'error' | 'info' | 'warning',
  expectedMessage: string,
) {
  // Direct goto exercises the same SSR + cookie-bridge path the form
  // submission would take, with one less click for cheaper coverage.
  await page.goto(`/trigger?type=${triggerType}`)
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
    await gotoTriggerAndExpectToast(
      page,
      'redirect-success',
      'success',
      'Saved your preferences',
    )
  })

  test('redirectWithError fires an error toast', async ({ page }) => {
    await gotoTriggerAndExpectToast(
      page,
      'redirect-error',
      'error',
      'Something went wrong',
    )
  })

  test('redirectWithInfo fires an info toast', async ({ page }) => {
    await gotoTriggerAndExpectToast(
      page,
      'redirect-info',
      'info',
      'maintenance window',
    )
  })

  test('redirectWithWarning fires a warning toast', async ({ page }) => {
    await gotoTriggerAndExpectToast(
      page,
      'redirect-warning',
      'warning',
      'unsaved changes',
    )
  })

  test('redirectWithToast (object input, default info) fires an info toast', async ({
    page,
  }) => {
    await gotoTriggerAndExpectToast(
      page,
      'redirect-generic',
      'info',
      'Generic toast',
    )
  })
})

test.describe('replaceWith* helpers', () => {
  test('replaceWithSuccess fires a success toast', async ({ page }) => {
    await gotoTriggerAndExpectToast(
      page,
      'replace-success',
      'success',
      'Replaced + success',
    )
  })

  test('replaceWithError fires an error toast', async ({ page }) => {
    await gotoTriggerAndExpectToast(
      page,
      'replace-error',
      'error',
      'Replaced + error',
    )
  })

  test('replaceWithInfo fires an info toast', async ({ page }) => {
    await gotoTriggerAndExpectToast(
      page,
      'replace-info',
      'info',
      'Replaced + info',
    )
  })

  test('replaceWithWarning fires a warning toast', async ({ page }) => {
    await gotoTriggerAndExpectToast(
      page,
      'replace-warning',
      'warning',
      'Replaced + warning',
    )
  })

  test('replaceWithToast (object input, default info) fires an info toast', async ({
    page,
  }) => {
    await gotoTriggerAndExpectToast(
      page,
      'replace-generic',
      'info',
      'Replaced + generic',
    )
  })
})

test.describe('form submission (canonical flow)', () => {
  test('selecting a radio + submitting the form fires the toast', async ({
    page,
  }) => {
    // The form on `/` is the realistic shape — it's exactly what an auth
    // flow / settings save / OAuth callback looks like. This test proves
    // the form path works, not just direct URL hits.
    await page.goto('/')
    await page.getByTestId('btn-redirect-error').check()
    await page.getByTestId('submit-trigger').click()
    await page.waitForURL('**/redirected')

    const row = page.getByTestId('toast-row').last()
    await expect(row).toBeVisible({ timeout: 5_000 })
    await expect(row).toHaveAttribute('data-type', 'error')
    await expect(row).toContainText('Something went wrong')
  })
})

test.describe('cookie clearing semantics', () => {
  test('refreshing /redirected does NOT re-fire the toast (cookie was cleared)', async ({
    page,
  }) => {
    await page.goto('/trigger?type=redirect-success')
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
