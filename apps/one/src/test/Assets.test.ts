import { describe, expect, it } from 'vitest'
import { brandAssets, resolveAssetUrl } from '@loodi/assets'

describe('@loodi/assets', () => {
  it('provides stable bundled URLs for the shared brand assets', () => {
    expect(brandAssets.logo).toContain('svg')
    expect(brandAssets.logoDark).toContain('svg')
    expect(brandAssets.wordmark).toContain('svg')
    expect(brandAssets.wordmarkDark).toContain('svg')
  })

  it('allows a standalone PWA to override the asset base without rebuilding UI', () => {
    expect(resolveAssetUrl('brand/logo', { baseUrl: 'https://assets.example.test/loodi/v1' }))
      .toBe('https://assets.example.test/loodi/v1/brand/logo.svg')
  })
})
