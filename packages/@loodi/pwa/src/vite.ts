import { VitePWA, type VitePWAOptions } from 'vite-plugin-pwa'

export interface LoodiPwaPluginOptions {
  appName: string
  shortName?: string
  description?: string
  themeColor?: string
  includeAssets?: string[]
  runtimeCaching?: NonNullable<NonNullable<VitePWAOptions['workbox']>['runtimeCaching']>
  /** Enable the Vite PWA manifest and development service worker. Disabled by default. */
  development?: boolean
}

const standardIcons = [72, 96, 120, 144, 152, 180, 192, 384, 512].map((size) => ({
  src: `/icons/icon-${size}.png`,
  sizes: `${size}x${size}`,
  type: 'image/png',
}))

export function createLoodiPwaPlugin(options: LoodiPwaPluginOptions) {
  const themeColor = options.themeColor ?? '#ca4a16'
  const shortName = options.shortName ?? options.appName

  return VitePWA({
    registerType: 'prompt',
    injectRegister: null,
    devOptions: {
      enabled: options.development ?? false,
    },
    includeAssets: options.includeAssets ?? ['icons/*.png'],
    manifest: {
      name: `${options.appName} — Loodi`,
      short_name: shortName,
      description: options.description ?? `${options.appName}, une application Loodi.`,
      theme_color: themeColor,
      background_color: themeColor,
      display: 'standalone',
      orientation: 'portrait-primary',
      start_url: '/',
      scope: '/',
      lang: 'fr',
      icons: [
        ...standardIcons,
        { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webmanifest}'],
      ...(options.runtimeCaching ? { runtimeCaching: options.runtimeCaching } : {}),
    },
  })
}
