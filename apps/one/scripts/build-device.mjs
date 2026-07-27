import { spawnSync } from 'node:child_process'
import { resolve } from 'node:path'
import {
  deviceBuildEnvironment,
  ensureDeviceCertificate,
  persistDeviceHost,
  resolveDeviceHost,
} from './device-host.mjs'

const mode = process.argv[2]
if (!['android-device', 'ios-device'].includes(mode)) {
  throw new Error('Usage : node scripts/build-device.mjs <android-device|ios-device>')
}

const { host, source, candidates } = resolveDeviceHost()
if (source === 'detected' && candidates.length > 1) {
  console.warn(`Plusieurs IP privées détectées (${candidates.join(', ')}). ${host} est utilisée ; définir LOODI_DEVICE_HOST=x.x.x.x pour forcer un choix.`)
}

persistDeviceHost(host)
const certificateRegenerated = ensureDeviceCertificate(host)
console.log(`Build ${mode} avec l'IP ${host}.`)
if (certificateRegenerated) {
  console.warn('Certificat mkcert régénéré : redémarrez les serveurs Vite des modules s’ils étaient déjà lancés.')
}

const result = spawnSync('npx', ['vite', 'build', '--mode', mode], {
  cwd: resolve(import.meta.dirname, '..'),
  env: deviceBuildEnvironment(host),
  stdio: 'inherit',
})
process.exitCode = result.status ?? 1

