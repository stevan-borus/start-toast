import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return (
    <main>
      <h1>react-start-toast example</h1>
      <p>
        Each link navigates to a <code>/trigger/$type</code> route whose
        loader calls one of the <code>redirectWith*</code> or{' '}
        <code>replaceWith*</code> helpers. The helper throws a TSS redirect to{' '}
        <code>/redirected</code>, where the toast fires once via{' '}
        <code>FlashToastEffect</code>. <code>replaceWith*</code> uses{' '}
        <code>history.replace</code>, so the browser back button skips the
        trigger page.
      </p>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: 320,
          }}
        >
          <strong>redirectWith* (push)</strong>
          <Link to="/trigger/$type" params={{ type: 'redirect-success' }} data-testid="btn-redirect-success">
            redirectWithSuccess
          </Link>
          <Link to="/trigger/$type" params={{ type: 'redirect-error' }} data-testid="btn-redirect-error">
            redirectWithError
          </Link>
          <Link to="/trigger/$type" params={{ type: 'redirect-info' }} data-testid="btn-redirect-info">
            redirectWithInfo
          </Link>
          <Link to="/trigger/$type" params={{ type: 'redirect-warning' }} data-testid="btn-redirect-warning">
            redirectWithWarning
          </Link>
          <Link to="/trigger/$type" params={{ type: 'redirect-generic' }} data-testid="btn-redirect-generic">
            redirectWithToast (object input)
          </Link>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            maxWidth: 320,
          }}
        >
          <strong>replaceWith* (no history entry)</strong>
          <Link to="/trigger/$type" params={{ type: 'replace-success' }} data-testid="btn-replace-success">
            replaceWithSuccess
          </Link>
          <Link to="/trigger/$type" params={{ type: 'replace-error' }} data-testid="btn-replace-error">
            replaceWithError
          </Link>
          <Link to="/trigger/$type" params={{ type: 'replace-info' }} data-testid="btn-replace-info">
            replaceWithInfo
          </Link>
          <Link to="/trigger/$type" params={{ type: 'replace-warning' }} data-testid="btn-replace-warning">
            replaceWithWarning
          </Link>
          <Link to="/trigger/$type" params={{ type: 'replace-generic' }} data-testid="btn-replace-generic">
            replaceWithToast (object input)
          </Link>
        </div>
      </div>
    </main>
  )
}
