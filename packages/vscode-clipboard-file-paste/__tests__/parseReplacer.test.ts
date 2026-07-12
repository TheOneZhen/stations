import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'
import { parseReplacer } from '../src/utils/url'

const fixedNow = dayjs('2026-07-13T03:54:22')

describe('parseReplacer', () => {
  it('formats [YYYY-MM] as month date', () => {
    expect(parseReplacer('[YYYY-MM]', { now: fixedNow })).toBe('2026-07')
  })

  it('formats date with spaces replaced by underscores', () => {
    expect(parseReplacer('[YYYY-MM-DD HH-mm-ss]', { now: fixedNow })).toBe(
      '2026-07-13_03-54-22',
    )
  })

  it('handles nested brackets [[YYYY-MM]]', () => {
    expect(parseReplacer('[[YYYY-MM]]', { now: fixedNow })).toBe('[2026-07]')
  })

  it('generates RID-4 with alphanumeric charset', () => {
    const values = [10 / 62, 2 / 62, 15 / 62, 2 / 62]
    let index = 0
    const result = parseReplacer('[RID-4]', {
      random: () => values[index++],
    })
    expect(result).toBe('A2F2')
    expect(result).toMatch(/^[0-9A-Za-z]{4}$/)
  })

  it('generates RID-5 with mixed case', () => {
    const values = [10 / 62, 15 / 62, 20 / 62, 13 / 62, 53 / 62]
    let index = 0
    const result = parseReplacer('[RID-5]', {
      random: () => values[index++],
    })
    expect(result).toBe('AFKDr')
    expect(result).toHaveLength(5)
  })

  it('treats [RID-5 ] the same as [RID-5]', () => {
    const values = [10 / 62, 15 / 62, 20 / 62, 13 / 62, 53 / 62]
    let index = 0
    const random = () => values[index++]

    const withSpace = parseReplacer('[RID-5 ]', { random })
    index = 0
    const withoutSpace = parseReplacer('[RID-5]', { random })

    expect(withSpace).toBe('AFKDr')
    expect(withSpace).toBe(withoutSpace)
  })

  it('keeps identical RID tokens consistent within one resolve', () => {
    const result = parseReplacer('[RID-4]/[RID-4]', { random: () => 0 })
    const [first, second] = result.split('/')
    expect(first).toBe(second)
    expect(first).toBe('0000')
  })

  it('keeps unknown placeholders unchanged', () => {
    expect(parseReplacer('[dirname]/[filename]', { now: fixedNow })).toBe(
      '[dirname]/[filename]',
    )
  })

  it('resolves mixed date and RID placeholders', () => {
    const result = parseReplacer('./images/[YYYY-MM-DD]/[RID-4]', {
      now: fixedNow,
      random: () => 0,
    })
    expect(result).toBe('./images/2026-07-13/0000')
  })
})
