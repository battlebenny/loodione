import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const projectRoot = resolve(process.cwd(), '../..')

describe('native configuration', () => {
  it('does not ship the Impeccable live-reload hook', () => {
    const index = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8')

    expect(index).not.toContain('localhost:8400/live.js')
    expect(index).not.toContain('impeccable-live')
  })

  it('declares camera usage on Android and iOS', () => {
    const androidManifest = readFileSync(
      resolve(projectRoot, 'android/app/src/main/AndroidManifest.xml'),
      'utf8',
    )
    const iosInfo = readFileSync(
      resolve(projectRoot, 'ios/App/App/Info.plist'),
      'utf8',
    )

    expect(androidManifest).toContain('android.permission.CAMERA')
    expect(iosInfo).toContain('<key>NSCameraUsageDescription</key>')
  })

  it('uses the GitHub Pages fallback registry on physical devices', () => {
    const apps = JSON.parse(readFileSync(resolve(process.cwd(), 'src/config/apps.android-device.json'), 'utf8'))

    expect(apps.find((app: { id: string }) => app.id === 'loodi')).toMatchObject({
      url: 'https://battlebenny.github.io/loodione/modules/loodi/',
    })
    expect(apps.find((app: { id: string }) => app.id === 'loodi-dev')).toBeUndefined()
  })

  it('exposes dedicated physical-device build and sync scripts', () => {
    const appPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'))
    const rootPackage = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'))

    expect(appPackage.scripts['build:android-device']).toBe('tsc -b && vite build --mode android-device')
    expect(rootPackage.scripts['build:android-device']).toBe('npm run build:android-device -w @loodi/one')
    expect(rootPackage.scripts['cap:sync:android-device']).toBe('npm run build:android-device && npx cap sync android')
    expect(appPackage.scripts['build:ios-device']).toBe('tsc -b && vite build --mode ios-device')
    expect(rootPackage.scripts['build:ios-device']).toBe('npm run build:ios-device -w @loodi/one')
    expect(rootPackage.scripts['cap:sync:ios-device']).toBe('npm run build:ios-device && npx cap sync ios')
    expect(rootPackage.scripts['test:run']).toBe('npm run test:run -w @loodi/one')
  })

  it('keeps the native shell served from Capacitor without a server URL override', () => {
    const capacitorConfig = JSON.parse(readFileSync(resolve(projectRoot, 'capacitor.config.json'), 'utf8'))

    expect(capacitorConfig.server?.url).toBeUndefined()
    expect(capacitorConfig.server?.hostname).toBe('app')
    expect(capacitorConfig.server?.allowNavigation).toEqual(['https://battlebenny.github.io'])
  })
})
