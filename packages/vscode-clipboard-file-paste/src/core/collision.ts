/**
 * Filename collision handling.
 *
 * When the target path already exists, append `-1`, `-2`, and so on
 * before the file extension until a free name is found.
 */
import path from 'node:path'

export const MAX_COLLISION_ATTEMPTS = 100

/** Yield incrementally suffixed paths: `photo.png`, `photo-1.png`, `photo-2.png`, ... */
export function* buildCollisionCandidates(filePath: string): Generator<string> {
  const dir = path.dirname(filePath)
  const ext = path.extname(filePath)
  const base = path.basename(filePath, ext)

  yield filePath

  let index = 1
  while (true) {
    yield path.join(dir, `${base}-${index}${ext}`)
    index++
  }
}

/** Return the first path for which `pathExists` returns false. */
export async function resolveAvailablePath(
  filePath: string,
  pathExists: (candidate: string) => boolean | Promise<boolean>,
  maxAttempts: number = MAX_COLLISION_ATTEMPTS,
): Promise<string> {
  let attempts = 0

  for (const candidate of buildCollisionCandidates(filePath)) {
    attempts++
    if (attempts > maxAttempts) {
      throw new Error(`Failed to find available path for ${filePath} after ${maxAttempts} attempts`)
    }

    if (!(await pathExists(candidate))) {
      return candidate
    }
  }

  throw new Error(`Failed to find available path for ${filePath}`)
}
