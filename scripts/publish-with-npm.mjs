import { execSync } from 'node:child_process';
import { existsSync, renameSync } from 'node:fs';

const lockfile = 'pnpm-lock.yaml';
const backup = 'pnpm-lock.yaml.bak';
const hasLockfile = existsSync(lockfile);

// changesets detects pnpm from pnpm-lock.yaml and runs `pnpm publish`,
// which does not support npm Trusted Publishing (OIDC). Temporarily hide
// the lockfile so changesets falls back to `npm publish`.
if (hasLockfile) {
  renameSync(lockfile, backup);
}

try {
  execSync('changeset publish', { stdio: 'inherit' });
} finally {
  if (hasLockfile && existsSync(backup)) {
    renameSync(backup, lockfile);
  }
}
