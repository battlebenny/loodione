import logo from './assets/brand/logo.svg?url'
import logoDark from './assets/brand/logo-dark.svg?url'
import wordmark from './assets/brand/loodi-wordmark.svg?url'
import wordmarkDark from './assets/brand/loodi-wordmark-dark.svg?url'
import monogram from './assets/brand/loodi-monogram.svg?url'
import monogramDark from './assets/brand/loodi-monogram-dark.svg?url'

export type BrandAssetName =
  | 'brand/logo'
  | 'brand/logo-dark'
  | 'brand/loodi-wordmark'
  | 'brand/loodi-wordmark-dark'
  | 'brand/loodi-monogram'
  | 'brand/loodi-monogram-dark'

const bundledAssets: Record<BrandAssetName, string> = {
  'brand/logo': logo,
  'brand/logo-dark': logoDark,
  'brand/loodi-wordmark': wordmark,
  'brand/loodi-wordmark-dark': wordmarkDark,
  'brand/loodi-monogram': monogram,
  'brand/loodi-monogram-dark': monogramDark,
}

const paths: Record<BrandAssetName, string> = {
  'brand/logo': 'brand/logo.svg',
  'brand/logo-dark': 'brand/logo-dark.svg',
  'brand/loodi-wordmark': 'brand/loodi-wordmark.svg',
  'brand/loodi-wordmark-dark': 'brand/loodi-wordmark-dark.svg',
  'brand/loodi-monogram': 'brand/loodi-monogram.svg',
  'brand/loodi-monogram-dark': 'brand/loodi-monogram-dark.svg',
}

/** The self-contained package build is the standalone default. */
export const DEFAULT_ASSET_BASE_URL: string | undefined = undefined

function normaliseBaseUrl(baseUrl: string): string {
  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
}

/**
 * Resolves a public asset URL. Without an override, the package uses its
 * bundled asset URL; an override makes a standalone PWA consume a CDN or a
 * local development origin without reimplementing asset paths.
 */
export function resolveAssetUrl(name: BrandAssetName, options?: { baseUrl?: string }): string {
  const baseUrl = options?.baseUrl ?? DEFAULT_ASSET_BASE_URL
  return baseUrl ? new URL(paths[name], normaliseBaseUrl(baseUrl)).toString() : bundledAssets[name]
}

export const brandAssets = {
  logo: resolveAssetUrl('brand/logo'),
  logoDark: resolveAssetUrl('brand/logo-dark'),
  wordmark: resolveAssetUrl('brand/loodi-wordmark'),
  wordmarkDark: resolveAssetUrl('brand/loodi-wordmark-dark'),
  monogram: resolveAssetUrl('brand/loodi-monogram'),
  monogramDark: resolveAssetUrl('brand/loodi-monogram-dark'),
} as const
