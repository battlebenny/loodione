import { copyFile, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = resolve(root, 'src')
const dist = resolve(root, 'dist')
const componentFiles = ['mini-header.css', 'bottom-nav.css', 'launcher.css']

await Promise.all([
  copyFile(resolve(dist, 'launcher-entry.d.ts'), resolve(dist, 'launcher.d.ts')),
  copyFile(resolve(dist, 'launcher-entry.d.ts.map'), resolve(dist, 'launcher.d.ts.map')),
  ...['tokens.css', 'tokens.dtcg.json', ...componentFiles].map((file) => copyFile(resolve(source, file), resolve(dist, file))),
  (async () => {
    const contents = await Promise.all(['tokens.css', ...componentFiles]
      .map((file) => readFile(resolve(source, file), 'utf8')))
    await writeFile(resolve(dist, 'styles.css'), `${contents.join('\n')}\n`)
  })(),
])
