import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { buildCollisionCandidates, resolveAvailablePath } from '../src/core/collision'

describe('buildCollisionCandidates', () => {
  it('generates incremental suffixes', () => {
    const inputPath = path.join('/tmp', 'photo.png')
    const candidates = []
    for (const candidate of buildCollisionCandidates(inputPath)) {
      candidates.push(candidate)
      if (candidates.length >= 3) {
        break
      }
    }

    expect(candidates).toEqual([
      inputPath,
      path.join('/tmp', 'photo-1.png'),
      path.join('/tmp', 'photo-2.png'),
    ])
  })
})

describe('resolveAvailablePath', () => {
  it('returns first available candidate', async () => {
    const initialPath = path.join('/tmp', 'a.png')
    const existing = new Set([
      initialPath,
      path.join('/tmp', 'a-1.png'),
    ])
    const result = await resolveAvailablePath(initialPath, async candidate =>
      existing.has(candidate))
    expect(result).toBe(path.join('/tmp', 'a-2.png'))
  })

  it('returns the original path when it does not exist', async () => {
    const result = await resolveAvailablePath('/tmp/new.png', async () => false)
    expect(result).toBe('/tmp/new.png')
  })
})
