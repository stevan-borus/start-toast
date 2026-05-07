import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { FlashToast } from '@tanstack/start-toast-core'
import { ToastProvider } from '../src/index.js'

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.clear()
  }
})

describe('<ToastProvider />', () => {
  it('renders the toaster slot and the children', () => {
    render(
      <ToastProvider
        toaster={<div data-testid="toaster">TOASTER</div>}
        toast={null}
        notify={vi.fn()}
      >
        <p data-testid="child">child content</p>
      </ToastProvider>,
    )
    expect(screen.getByTestId('toaster').textContent).toBe('TOASTER')
    expect(screen.getByTestId('child').textContent).toBe('child content')
  })

  it('fires notify when a toast is present', () => {
    const notify = vi.fn()
    const toast: FlashToast = { type: 'info', message: 'Hi', _id: 'p-1' }
    render(
      <ToastProvider toaster={null} toast={toast} notify={notify}>
        <span />
      </ToastProvider>,
    )
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith(toast)
  })

  it('does not fire notify when toast is null', () => {
    const notify = vi.fn()
    render(
      <ToastProvider toaster={null} toast={null} notify={notify}>
        <span />
      </ToastProvider>,
    )
    expect(notify).not.toHaveBeenCalled()
  })

  it('renders the toaster BEFORE FlashToastEffect (correct source order)', () => {
    // Mark each child with a data-order attribute. The toaster slot must be
    // earlier in the DOM than any descendant of FlashToastEffect — which
    // renders nothing, so the only observable check is "toaster appears, and
    // children come after it." That indirectly verifies the JSX order.
    const { container } = render(
      <ToastProvider
        toaster={<div data-testid="t">A</div>}
        toast={null}
        notify={vi.fn()}
      >
        <div data-testid="c">B</div>
      </ToastProvider>,
    )
    const html = container.innerHTML
    expect(html.indexOf('data-testid="t"')).toBeLessThan(
      html.indexOf('data-testid="c"'),
    )
  })
})
