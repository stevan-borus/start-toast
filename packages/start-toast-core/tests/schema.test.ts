import { describe, it, expect } from 'vitest'
import { flashToastSchema } from '../src/index.js'

describe('flashToastSchema', () => {
  it('accepts a valid info toast', () => {
    const result = flashToastSchema.safeParse({
      message: 'Hello',
      type: 'info',
      _id: 'abc',
    })
    expect(result.success).toBe(true)
  })

  it('rejects an unknown type value', () => {
    const result = flashToastSchema.safeParse({
      message: 'Hello',
      type: 'celebration',
      _id: 'abc',
    })
    expect(result.success).toBe(false)
  })

  it('requires _id', () => {
    const result = flashToastSchema.safeParse({
      message: 'Hello',
      type: 'info',
    })
    expect(result.success).toBe(false)
  })

  it('accepts optional description and duration', () => {
    const result = flashToastSchema.safeParse({
      message: 'Done',
      type: 'success',
      description: 'Your post is live',
      duration: 6000,
      _id: 'xyz',
    })
    expect(result.success).toBe(true)
  })
})
