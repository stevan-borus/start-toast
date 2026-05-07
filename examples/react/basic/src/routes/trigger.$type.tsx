import { createFileRoute, notFound } from '@tanstack/react-router'
import { isTriggerKey, triggerFn } from '../triggers.functions'

export const Route = createFileRoute('/trigger/$type')({
  loader: async ({ params }) => {
    if (!isTriggerKey(params.type)) throw notFound()
    // The server fn throws a TSS redirect — that propagates through the
    // loader, the router consumes it, and the browser navigates to
    // /redirected with the flash cookie staged.
    await triggerFn({ data: { type: params.type } })
    return null
  },
})
