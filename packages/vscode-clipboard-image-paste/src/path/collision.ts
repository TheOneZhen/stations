import * as path from "node:path";

export function buildCollisionCandidates(basePath: string): string[] {
  const ext = path.extname(basePath);
  const baseName = basePath.slice(0, basePath.length - ext.length);
  const candidates = [basePath];

  for (let index = 1; index <= 999; index += 1) {
    candidates.push(`${baseName}-${index}${ext}`);
  }

  return candidates;
}

export async function resolveAvailablePath(
  basePath: string,
  exists: (candidate: string) => Promise<boolean>,
): Promise<string> {
  for (const candidate of buildCollisionCandidates(basePath)) {
    if (!(await exists(candidate))) {
      return candidate;
    }
  }

  throw new Error(`Could not find available path for "${basePath}".`);
}
