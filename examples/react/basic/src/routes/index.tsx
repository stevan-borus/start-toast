import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/react-start'
import {
  redirectWithError,
  redirectWithInfo,
  redirectWithSuccess,
  redirectWithToast,
  redirectWithWarning,
} from '@tanstack/react-start-toast'

const triggerSuccessFn = createServerFn({ method: 'POST' }).handler(
  async () => redirectWithSuccess('/redirected', 'Saved your preferences'),
)
const triggerErrorFn = createServerFn({ method: 'POST' }).handler(
  async () => redirectWithError('/redirected', 'Something went wrong'),
)
const triggerInfoFn = createServerFn({ method: 'POST' }).handler(
  async () => redirectWithInfo('/redirected', 'FYI: maintenance window 9pm'),
)
const triggerWarningFn = createServerFn({ method: 'POST' }).handler(
  async () => redirectWithWarning('/redirected', 'Heads up — unsaved changes'),
)
const triggerGenericFn = createServerFn({ method: 'POST' }).handler(
  async () =>
    redirectWithToast('/redirected', {
      message: 'Generic toast',
      description: 'Defaults to type=info',
      duration: 4000,
    }),
)

export const Route = createFileRoute('/')({
  component: IndexComponent,
})

function IndexComponent() {
  return (
    <main>
      <h1>react-start-toast example</h1>
      <p>
        Each button triggers a server fn that calls one of the
        <code> redirectWith* </code> helpers, then this page is replaced by
        <code> /redirected </code>, where the toast fires once via
        <code> FlashToastEffect </code>.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
        <button data-testid="btn-success" onClick={() => triggerSuccessFn()}>
          redirectWithSuccess
        </button>
        <button data-testid="btn-error" onClick={() => triggerErrorFn()}>
          redirectWithError
        </button>
        <button data-testid="btn-info" onClick={() => triggerInfoFn()}>
          redirectWithInfo
        </button>
        <button data-testid="btn-warning" onClick={() => triggerWarningFn()}>
          redirectWithWarning
        </button>
        <button data-testid="btn-generic" onClick={() => triggerGenericFn()}>
          redirectWithToast (object input)
        </button>
      </div>
    </main>
  )
}
