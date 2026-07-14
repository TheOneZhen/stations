import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const pkgDir = 'packages/vscode-clipboard-file-paste'
const pkgPath = join(root, pkgDir, 'package.json')
const PKG_NAME = 'vscode-clipboard-file-paste'

function run(command, options = {}) {
  return execSync(command, {
    cwd: root,
    encoding: 'utf8',
    stdio: options.stdio ?? 'pipe',
  })
}

function tagName(version) {
  return `${PKG_NAME}@${version}`
}

function tagExists(tag) {
  try {
    return run(`git tag --list ${JSON.stringify(tag)}`).trim().length > 0
  }
  catch {
    return false
  }
}

function versionChangedInReleaseCommit() {
  try {
    const diff = run(`git diff HEAD~1 -- ${JSON.stringify(`${pkgDir}/package.json`)}`)
    return /^\+.*"version"\s*:/m.test(diff)
  }
  catch {
    // Shallow history or first commit: treat as changed so a first release can proceed.
    return true
  }
}

function createAndPushTag(tag) {
  run(`git tag ${JSON.stringify(tag)}`, { stdio: 'inherit' })
  try {
    run(`git push origin ${JSON.stringify(tag)}`, { stdio: 'inherit' })
  }
  catch (error) {
    console.warn(`[vscode-extension] Tagged ${tag} locally but failed to push:`, error.message)
  }
}

const { version } = JSON.parse(readFileSync(pkgPath, 'utf8'))
const tag = tagName(version)
const pat = process.env.VSCE_PAT

if (!pat) {
  console.log('[vscode-extension] VSCE_PAT not set; skipping Marketplace publish.')
  process.exit(0)
}

if (tagExists(tag)) {
  console.log(`[vscode-extension] Tag ${tag} already exists; skipping Marketplace publish.`)
  process.exit(0)
}

if (!versionChangedInReleaseCommit()) {
  console.log(
    `[vscode-extension] ${PKG_NAME} version unchanged in this release commit; skipping Marketplace publish.`,
  )
  process.exit(0)
}

console.log(`[vscode-extension] Publishing ${PKG_NAME}@${version} to VS Marketplace...`)

run('pnpm --filter vscode-clipboard-file-paste run compile', { stdio: 'inherit' })
run(
  `pnpm --filter vscode-clipboard-file-paste exec vsce publish --no-dependencies -p ${JSON.stringify(pat)}`,
  { stdio: 'inherit' },
)

createAndPushTag(tag)
console.log(`[vscode-extension] Published and tagged ${tag}.`)
