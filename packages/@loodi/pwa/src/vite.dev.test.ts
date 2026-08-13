// @vitest-environment node

import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'vite'
import { afterEach, describe, expect, it } from 'vitest'
import { createLoodiPwaPlugin } from './vite.js'

let fixtureRoot: string | undefined

afterEach(async () => {
  if (fixtureRoot) await rm(fixtureRoot, { force: true, recursive: true })
  fixtureRoot = undefined
})

describe('Vite PWA development mode', () => {
  it('serves a manifest and JavaScript service worker when explicitly enabled', async () => {
    fixtureRoot = await mkdtemp(join(tmpdir(), 'loodi-pwa-dev-'))
    await writeFile(fixtureRoot + '/index.html', '<!doctype html><title>Fixture</title>')

    const server = await createServer({
      logLevel: 'silent',
      plugins: createLoodiPwaPlugin({ appName: 'Fixture', development: true }),
      root: fixtureRoot,
      server: { port: 0 },
    })

    try {
      await server.listen(51234)
      const address = server.httpServer?.address()
      if (!address || typeof address === 'string') throw new Error('Vite development server did not expose a TCP port')
      const host = address.address.includes(':') ? `[${address.address}]` : address.address
      const origin = `http://${host}:${address.port}`
      const [manifest, serviceWorker] = await Promise.all([
        fetch(`${origin}/manifest.webmanifest`),
        fetch(`${origin}/dev-sw.js?dev-sw`),
      ])

      expect(manifest.headers.get('content-type')).toContain('application/manifest+json')
      expect(await manifest.json()).toMatchObject({ name: 'Fixture — Loodi' })
      expect(serviceWorker.headers.get('content-type')).toContain('javascript')
      expect(await serviceWorker.text()).not.toContain('<!doctype html>')
    } finally {
      await server.close()
    }
  })
})
