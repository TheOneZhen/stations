import { describe, expect, it } from 'vitest'
import { findAltTextSelection } from '../src/core/altTextSelection'

describe('findAltTextSelection', () => {
  it('finds markdown image alt text range', () => {
    expect(
      findAltTextSelection('![description](./photo.png)', 'markdown'),
    ).toEqual({ start: 2, end: 13 })
  })

  it('finds markdown link text range', () => {
    expect(
      findAltTextSelection('[description](./photo.png)', 'markdown'),
    ).toEqual({ start: 1, end: 12 })
  })

  it('finds html anchor text range', () => {
    expect(
      findAltTextSelection('<a href="./photo.png">description</a>', 'html'),
    ).toEqual({ start: 22, end: 33 })
  })

  it('finds html alt attribute range', () => {
    expect(
      findAltTextSelection('<img alt="description" src="./photo.png" />', 'html'),
    ).toEqual({ start: 10, end: 21 })
  })
})
