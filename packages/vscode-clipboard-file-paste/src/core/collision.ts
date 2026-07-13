import path from 'node:path'

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

/** Return the first path that does not already exist. */
export async function resolveAvailablePath(
  filePath: string,
  pathExists: (candidate: string) => boolean | Promise<boolean>,
): Promise<string> {
  for (const candidate of buildCollisionCandidates(filePath)) {
    if (!(await pathExists(candidate))) {
      return candidate
    }
  }

  throw new Error(`Failed to find available path for ${filePath}`)
}
