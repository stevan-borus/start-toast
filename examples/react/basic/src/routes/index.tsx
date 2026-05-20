import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

const REDIRECT_OPTIONS = [
  { value: 'redirect-success', label: 'redirectWithSuccess' },
  { value: 'redirect-error', label: 'redirectWithError' },
  { value: 'redirect-info', label: 'redirectWithInfo' },
  { value: 'redirect-warning', label: 'redirectWithWarning' },
  { value: 'redirect-generic', label: 'redirectWithToast (object input)' },
] as const

const REPLACE_OPTIONS = [
  { value: 'replace-success', label: 'replaceWithSuccess' },
  { value: 'replace-error', label: 'replaceWithError' },
  { value: 'replace-info', label: 'replaceWithInfo' },
  { value: 'replace-warning', label: 'replaceWithWarning' },
  { value: 'replace-generic', label: 'replaceWithToast (object input)' },
] as const

function IndexComponent() {
  return (
    <main>
      <h1>react-start-toast example</h1>
      <p>
        The form below submits to <code>/trigger?type=…</code>. That route's
        loader calls one of the <code>redirectWith*</code> or{' '}
        <code>replaceWith*</code> helpers, which throws a TSS redirect to{' '}
        <code>/redirected</code> with the flash cookie staged on the response.
        The next request — the redirect target — replays the cookie, the root
        loader unseals it via <code>consumeFlashToastFn</code>, and{' '}
        <code>FlashToastEffect</code> fires the toast once.
      </p>
      <p style={{ fontSize: '0.875rem', color: '#666' }}>
        This is the canonical flash-toast shape: a form submission (or any
        full-page navigation — OAuth callback, sign-out, email verification
        link) hits a server-side handler that stages the cookie before
        redirecting. Pure-client navigation through a redirect-throwing loader
        doesn't work — the destination loader runs before the browser commits
        the cookie. If you find yourself wanting a flash toast on a client-side
        action, fire your toast UI directly in the mutation's{' '}
        <code>onSuccess</code> instead.
      </p>
      <form
        method="GET"
        action="/trigger"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          maxWidth: 480,
        }}
      >
        <fieldset>
          <legend>
            <strong>redirectWith*</strong> — adds a history entry
          </legend>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginTop: 8,
            }}
          >
            {REDIRECT_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  data-testid={`btn-${value}`}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset>
          <legend>
            <strong>replaceWith*</strong> — replaces the current entry, back
            button skips it
          </legend>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              marginTop: 8,
            }}
          >
            {REPLACE_OPTIONS.map(({ value, label }) => (
              <label
                key={value}
                style={{ display: 'flex', gap: 8, alignItems: 'center' }}
              >
                <input
                  type="radio"
                  name="type"
                  value={value}
                  data-testid={`btn-${value}`}
                />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <button
          type="submit"
          data-testid="submit-trigger"
          style={{ padding: '8px 16px', fontSize: 14 }}
        >
          Submit
        </button>
      </form>
    </main>
  )
}
