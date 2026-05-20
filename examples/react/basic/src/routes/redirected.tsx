import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/redirected')({
  component: RedirectedComponent,
})

function RedirectedComponent() {
  return (
    <main>
      <h1>You were redirected</h1>
      <p>
        The toast fired once on this page (see top-right feed). Refresh to prove
        the cookie was cleared — no second toast.
      </p>
      <Link to="/">← Back to triggers</Link>
    </main>
  )
}
