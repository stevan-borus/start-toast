import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render } from '@testing-library/react'
import type { FlashToast } from 'start-toast-core'
import { FlashToastEffect } from '../src/index.js'

beforeEach(() => {
  if (typeof window !== 'undefined') {
    window.sessionStorage.clear()
  }
})

describe('<FlashToastEffect />', () => {
  it('calls notify once when given a fresh toast', () => {
    const notify = vi.fn()
    const toast: FlashToast = { type: 'info', message: 'Hi', _id: 'fresh-1' }
    render(<FlashToastEffect toast={toast} notify={notify} />)
    expect(notify).toHaveBeenCalledTimes(1)
    expect(notify).toHaveBeenCalledWith(toast)
  })

  it('does not call notify when toast is null', () => {
    const notify = vi.fn()
    render(<FlashToastEffect toast={null} notify={notify} />)
    expect(notify).not.toHaveBeenCalled()
  })

  it('dedupes by _id across renders within the session', () => {
    const notify = vi.fn()
    const toast: FlashToast = { type: 'info', message: 'Hi', _id: 'dedupe-1' }
    const { rerender } = render(
      <FlashToastEffect toast={toast} notify={notify} />,
    )
    rerender(<FlashToastEffect toast={toast} notify={notify} />)
    expect(notify).toHaveBeenCalledTimes(1)
  })

  it('fires again for a different _id', () => {
    const notify = vi.fn()
    const a: FlashToast = { type: 'info', message: 'A', _id: 'id-a' }
    const b: FlashToast = { type: 'success', message: 'B', _id: 'id-b' }
    const { rerender } = render(<FlashToastEffect toast={a} notify={notify} />)
    rerender(<FlashToastEffect toast={b} notify={notify} />)
    expect(notify).toHaveBeenCalledTimes(2)
  })
})
