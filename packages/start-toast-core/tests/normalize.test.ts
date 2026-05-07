import { describe, it, expect } from 'vitest'
import { normalizeFlashInput } from '../src/index.js'

describe('normalizeFlashInput', () => {
  it('turns a string into { message, type: defaultType }', () => {
    expect(normalizeFlashInput('Hello', 'info')).toEqual({
      message: 'Hello',
      type: 'info',
    })
  })

  it('preserves explicit type over defaultType', () => {
    expect(
      normalizeFlashInput({ message: 'Boom', type: 'error' }, 'info'),
    ).toEqual({
      message: 'Boom',
      type: 'error',
    })
  })

  it('falls back to defaultType when object input has no explicit type', () => {
    expect(normalizeFlashInput({ message: 'Note' }, 'warning')).toEqual({
      message: 'Note',
      type: 'warning',
    })
  })

  it('passes through description and duration', () => {
    expect(
      normalizeFlashInput(
        { message: 'Done', description: 'Saved', duration: 6000 },
        'success',
      ),
    ).toEqual({
      message: 'Done',
      type: 'success',
      description: 'Saved',
      duration: 6000,
    })
  })
})
