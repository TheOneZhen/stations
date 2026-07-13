import process from 'node:process'
import esbuild from 'esbuild'
import { syncContributes } from './scripts/sync-contributes.mjs'

const watch = process.argv.includes('--watch')

const ctx = await esbuild.context({
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: true,
  minify: false,
})

async function buildExtension() {
  await ctx.rebuild()
  await syncContributes()
}

if (watch) {
  await buildExtension()
  await ctx.watch()
  console.log('Watching for changes...')
}
else {
  await buildExtension()
  await ctx.dispose()
}
