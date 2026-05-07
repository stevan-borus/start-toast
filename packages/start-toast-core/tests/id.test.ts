import { describe, it, expect } from 'vitest'
import { makeFlashToastId } from '../src/index.js'

describe('makeFlashToastId', () => {
  it('returns a non-empty string', () => {
    const id = makeFlashToastId()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('returns different ids on consecutive calls', () => {
    const a = makeFlashToastId()
    const b = makeFlashToastId()
    expect(a).not.toBe(b)
  })
})
