import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'
import { FlashToastEffect } from '@tanstack/react-start-toast'
import { consumeFlashToastFn } from '../flash-toast.functions'
import type { ReactNode } from 'react'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'react-start-toast example' },
    ],
  }),
  loader: async () => ({
    flashToast: await consumeFlashToastFn(),
  }),
  component: RootComponent,
})

function RootComponent() {
  const { flashToast } = Route.useLoaderData()
  return (
    <RootDocument>
      <ToastFeed />
      <FlashToastEffect
        toast={flashToast}
        notify={(t) => {
          // Stand-in renderer until the sonner adapter slice. The `toast-feed`
          // div appends a row so Playwright + humans can verify behavior.
          const feed = document.getElementById('toast-feed')
          if (!feed) return
          const row = document.createElement('div')
          row.dataset.testid = 'toast-row'
          row.dataset.type = t.type
          row.dataset.id = t._id
          row.textContent = `[${t.type}] ${t.message}`
          feed.appendChild(row)
        }}
      />
      <Outlet />
    </RootDocument>
  )
}

function ToastFeed() {
  return (
    <div
      id="toast-feed"
      data-testid="toast-feed"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        padding: '0.5rem',
        background: '#222',
        color: '#fff',
        fontFamily: 'monospace',
        fontSize: 12,
        maxWidth: 320,
        zIndex: 1000,
      }}
    />
  )
}

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body style={{ fontFamily: 'system-ui, sans-serif', margin: 0, padding: 24 }}>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
