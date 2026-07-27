import { existsSync, writeFileSync } from 'node:fs'
import { networkInterfaces } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const root = resolve(import.meta.dirname, '../../..')
const stateFile = resolve(root, '.device-host.json')
const certFile = resolve(root, '.certs/cert.pem')
const keyFile = resolve(root, '.certs/key.pem')

function isPrivateIpv4(address) {
  const octets = address.split('.').map(Number)
  if (octets.length !== 4 || octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false
  return octets[0] === 10
    || (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31)
    || (octets[0] === 192 && octets[1] === 168)
}

export function resolveDeviceHost(environment = process.env) {
  const override = environment.LOODI_DEVICE_HOST?.trim()
  if (override) {
    if (!isPrivateIpv4(override)) throw new Error('LOODI_DEVICE_HOST doit être une adresse IPv4 privée (ex. 192.168.1.42).')
    return { host: override, source: 'override', candidates: [] }
  }

  const candidates = [...new Set(Object.values(networkInterfaces())
    .flat()
    .flatMap((network) => network && network.family === 'IPv4' && !network.internal && isPrivateIpv4(network.address)
      ? [network.address]
      : []))]
  if (candidates.length === 0) throw new Error('Aucune IPv4 privée détectée. Connectez le Mac à un réseau ou utilisez LOODI_DEVICE_HOST=x.x.x.x.')
  return { host: candidates[0], source: 'detected', candidates }
}

export function persistDeviceHost(host) {
  writeFileSync(stateFile, `${JSON.stringify({ host }, null, 2)}\n`)
}

export function certificateCovers(host) {
  if (!existsSync(certFile)) return false
  const result = spawnSync('openssl', ['x509', '-in', certFile, '-noout', '-ext', 'subjectAltName'], { encoding: 'utf8' })
  return result.status === 0 && result.stdout.includes(`IP Address:${host}`)
}

export function ensureDeviceCertificate(host) {
  if (certificateCovers(host)) return false
  const result = spawnSync('mkcert', [
    '-cert-file', certFile,
    '-key-file', keyFile,
    'localhost', '*.loodi.test', '10.0.2.2', host,
  ], { cwd: root, encoding: 'utf8', stdio: 'inherit' })
  if (result.status !== 0) throw new Error('La génération du certificat mkcert a échoué.')
  return true
}

export function deviceBuildEnvironment(host) {
  return { ...process.env, LOODI_DEVICE_HOST: host, VITE_LOODI_DEVICE_HOST: host }
}
