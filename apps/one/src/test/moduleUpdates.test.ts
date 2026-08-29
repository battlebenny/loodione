import { describe, expect, it, vi } from 'vitest'
import { refreshPersistentModuleIframe } from '../moduleUpdates'

const MODULE_URL = 'https://loodicollec.vercel.app/?loodi-shell=1&headerHeight=120&bottomNavHeight=96'

function frame() {
  const iframe = document.createElement('iframe')
  iframe.src = MODULE_URL
  return iframe
}

describe('persistent module updates', () => {
  it('reloads only the persistent iframe when its revision changes', async () => {
    const iframe = frame()
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ revision: 'BB78wfC4' }) })

    const result = await refreshPersistentModuleIframe(iframe, 'RVcQ_c5f', fetcher)

    expect(result).toEqual({ revision: 'BB78wfC4', reloaded: true })
    expect(iframe.src).toContain('loodi-revision=BB78wfC4')
    expect(iframe.src).toContain('headerHeight=120')
    expect(fetcher).toHaveBeenCalledWith('https://loodicollec.vercel.app/.well-known/loodi-module.json', { cache: 'no-store' })
  })

  it('refreshes once after launch when Android restores an iframe with no known revision', async () => {
    const iframe = frame()

    const result = await refreshPersistentModuleIframe(iframe, undefined, vi.fn().mockResolvedValue({ ok: true, json: async () => ({ revision: 'BB78wfC4' }) }))

    expect(result).toEqual({ revision: 'BB78wfC4', reloaded: true })
    expect(iframe.src).toContain('loodi-revision=BB78wfC4')
  })

  it('keeps a usable persistent iframe when the version network request fails', async () => {
    const iframe = frame()
    const before = iframe.src

    const result = await refreshPersistentModuleIframe(iframe, 'RVcQ_c5f', vi.fn().mockRejectedValue(new Error('offline')))

    expect(result).toEqual({ revision: 'RVcQ_c5f', reloaded: false })
    expect(iframe.src).toBe(before)
  })

  it('does not reload a persistent iframe when its revision is unchanged', async () => {
    const iframe = frame()
    const before = iframe.src

    const result = await refreshPersistentModuleIframe(iframe, 'BB78wfC4', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ revision: 'BB78wfC4' }) }))

    expect(result).toEqual({ revision: 'BB78wfC4', reloaded: false })
    expect(iframe.src).toBe(before)
  })

  it('falls back to an entry-document fingerprint when no manifest is deployed yet', async () => {
    const iframe = frame()
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => { throw new Error('not json') } })
      .mockResolvedValueOnce({ ok: true, text: async () => '<script src="/assets/HomePage-BB78wfC4.js"></script>' })

    const result = await refreshPersistentModuleIframe(iframe, 'old-revision', fetcher)

    expect(result.reloaded).toBe(true)
    expect(result.revision).not.toBe('old-revision')
    expect(iframe.src).toContain('loodi-revision=')
    expect(fetcher).toHaveBeenLastCalledWith('https://loodicollec.vercel.app/', { cache: 'no-store' })
  })
})
