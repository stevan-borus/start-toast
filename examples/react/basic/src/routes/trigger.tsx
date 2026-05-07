import { createFileRoute, notFound } from '@tanstack/react-router'
import { isTriggerKey, triggerFn } from '../triggers.functions'

export const Route = createFileRoute('/trigger')({
  validateSearch: (search: Record<string, unknown>) => {
    const type = search.type
    if (typeof type !== 'string' || !isTriggerKey(type)) {
      throw notFound()
    }
    return { type }
  },
  loaderDeps: ({ search }) => ({ type: search.type }),
  loader: async ({ deps }) => {
    // Form-submitted GET lands here. The server fn throws a TSS redirect to
    // /redirected with the flash cookie staged on the response.
    await triggerFn({ data: { type: deps.type } })
    return null
  },
})
