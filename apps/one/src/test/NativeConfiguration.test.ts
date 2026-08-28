import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = resolve(process.cwd(), '../..');

describe('native configuration', () => {
  it('does not ship the Impeccable live-reload hook', () => {
    const index = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

    expect(index).not.toContain('localhost:8400/live.js');
    expect(index).not.toContain('impeccable-live');
  });

  it('declares camera usage on Android and iOS', () => {
    const androidManifest = readFileSync(resolve(projectRoot, 'android/app/src/main/AndroidManifest.xml'), 'utf8');
    const iosInfo = readFileSync(resolve(projectRoot, 'ios/App/App/Info.plist'), 'utf8');

    expect(androidManifest).toContain('android.permission.CAMERA');
    expect(iosInfo).toContain('<key>NSCameraUsageDescription</key>');
  });

  it('uses the build-time network host template on physical devices', () => {
    const apps = JSON.parse(readFileSync(resolve(process.cwd(), 'src/config/apps.android-device.json'), 'utf8'));

    expect(apps.find((app: { id: string }) => app.id === 'loodi-collec')).toMatchObject({
      url: 'https://{{DEVICE_HOST}}:4002',
    });
    expect(apps.find((app: { id: string }) => app.id === 'loodi-dev')).toMatchObject({
      url: 'https://{{DEVICE_HOST}}:4000',
    });
  });

  it('exposes dedicated physical-device build and sync scripts', () => {
    const appPackage = JSON.parse(readFileSync(resolve(process.cwd(), 'package.json'), 'utf8'));
    const rootPackage = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));

    expect(appPackage.scripts['build:android-device']).toBe('tsc -b && node scripts/build-device.mjs android-device');
    expect(rootPackage.scripts['build:android-device']).toBe('npm run build:android-device -w @loodi/one');
    expect(rootPackage.scripts['cap:sync:android-device']).toBe('node apps/one/scripts/sync-device.mjs android');
    expect(appPackage.scripts['build:ios-device']).toBe('tsc -b && node scripts/build-device.mjs ios-device');
    expect(rootPackage.scripts['build:ios-device']).toBe('npm run build:ios-device -w @loodi/one');
    expect(rootPackage.scripts['cap:sync:ios-device']).toBe('node apps/one/scripts/sync-device.mjs ios');
    expect(rootPackage.scripts['test:run']).toBe('npm run test:run -w @loodi/one');
  });

  it('injects the detected device IP into Capacitor navigation only during device sync', () => {
    const capacitorConfig = readFileSync(resolve(projectRoot, 'capacitor.config.json'), 'utf8');
    const syncScript = readFileSync(resolve(process.cwd(), 'scripts/sync-device.mjs'), 'utf8');

    expect(capacitorConfig).not.toContain('"https://*"');
    expect(syncScript).toContain('`https://${host}`');
    expect(syncScript).toContain('finally');
  });

  it('uses Capacitor’s built-in system-bars runtime without replacing its safe-area handling', () => {
    const capacitorConfig = JSON.parse(readFileSync(resolve(projectRoot, 'capacitor.config.json'), 'utf8'));
    const rootPackage = JSON.parse(readFileSync(resolve(projectRoot, 'package.json'), 'utf8'));

    expect(rootPackage.dependencies['@capacitor/status-bar']).toBeUndefined();
    expect(capacitorConfig.plugins.SystemBars.style).toBe('DEFAULT');
  });

  it('keeps the remotely published registry in the public deployment folder', () => {
    const registry = JSON.parse(readFileSync(resolve(projectRoot, 'public/config.json'), 'utf8'));

    expect(registry).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 'loodi-collec', url: 'https://loodicollec.vercel.app' }),
        expect.objectContaining({ id: 'loodi-friends', url: 'https://loodifriends.vercel.app' }),
        expect.objectContaining({
          id: 'loodi-planner',
          name: 'Planner',
          icon: 'https://battlebenny.github.io/loodione/icons/loodi-planner.svg',
        }),
      ]),
    );
    expect(registry.some((app: { id: string }) => app.id === 'loodi-sessions')).toBe(false);
    expect(
      registry.every((app: { icon: string }) => app.icon.startsWith('https://battlebenny.github.io/loodione/icons/')),
    ).toBe(true);
    for (const app of registry) {
      expect(
        existsSync(resolve(projectRoot, 'public', app.icon.replace('https://battlebenny.github.io/loodione/', ''))),
      ).toBe(true);
      expect(
        existsSync(
          resolve(
            projectRoot,
            'public',
            app.icon.replace('https://battlebenny.github.io/loodione/', '').replace(/\.svg$/, '-dark.svg'),
          ),
        ),
      ).toBe(true);
    }
  });

  it('deploys only the public folder to GitHub Pages', () => {
    const workflow = readFileSync(resolve(projectRoot, '.github/workflows/deploy-public-pages.yml'), 'utf8');

    expect(workflow).toContain('path: public');
    expect(workflow).toContain('actions/deploy-pages');
  });
});
