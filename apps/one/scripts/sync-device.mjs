import { spawnSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { deviceBuildEnvironment, resolveDeviceHost } from './device-host.mjs'

const platform = process.argv[2]
if (!['android', 'ios'].includes(platform)) throw new Error('Usage : node apps/one/scripts/sync-device.mjs <android|ios>')

const mode = `${platform}-device`
const { host } = resolveDeviceHost()
const env = deviceBuildEnvironment(host)
const root = resolve(import.meta.dirname, '../../..')
const capacitorConfigFile = resolve(root, 'capacitor.config.json')

const build = spawnSync('npm', ['run', `build:${mode}`, '-w', '@loodi/one'], { cwd: root, env, stdio: 'inherit' })
if (build.status !== 0) process.exit(build.status ?? 1)

const originalConfig = readFileSync(capacitorConfigFile, 'utf8')
try {
  const config = JSON.parse(originalConfig)
  config.server.allowNavigation = [...new Set([
    ...(config.server.allowNavigation ?? []),
    `https://${host}`,
  ])]
  writeFileSync(capacitorConfigFile, `${JSON.stringify(config, null, 2)}\n`)

  const sync = spawnSync('npx', ['cap', 'sync', platform], { cwd: root, env, stdio: 'inherit' })
  if (sync.status !== 0) process.exitCode = sync.status ?? 1
} finally {
  writeFileSync(capacitorConfigFile, originalConfig)
}
