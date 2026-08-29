export interface ModuleRevisionManifest {
  revision: string
}

export type ModuleRevisionFetcher = (url: string, options?: RequestInit) => Promise<{
  ok: boolean
  json(): Promise<unknown>
  text?(): Promise<string>
}>

export function moduleRevisionManifestUrl(moduleUrl: string): string {
  const url = new URL(moduleUrl)
  return new URL('/.well-known/loodi-module.json', url.origin).toString()
}

export function appendModuleRevision(moduleUrl: string, revision: string): string {
  const url = new URL(moduleUrl)
  url.searchParams.set('loodi-revision', revision)
  return url.toString()
}

function parseManifest(value: unknown): ModuleRevisionManifest | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const revision = (value as Record<string, unknown>).revision
  return typeof revision === 'string' && revision.trim() !== '' ? { revision } : null
}

/** A stable, compact identifier for an entry document when a module has not yet published a manifest. */
export function fingerprintModuleDocument(document: string): string {
  let hash = 0x811c9dc5
  for (let index = 0; index < document.length; index += 1) {
    hash ^= document.charCodeAt(index)
    hash = Math.imul(hash, 0x01000193)
  }
  return `document-${(hash >>> 0).toString(36)}`
}

async function fetchRevision(
  moduleUrl: string,
  fetcher: ModuleRevisionFetcher,
): Promise<string | undefined> {
  const manifestResponse = await fetcher(moduleRevisionManifestUrl(moduleUrl), { cache: 'no-store' })
  if (manifestResponse.ok) {
    try {
      const manifest = parseManifest(await manifestResponse.json())
      if (manifest) return manifest.revision
    } catch { /* Use the entry-document fallback below. */ }
  }

  const entryUrl = new URL('/', new URL(moduleUrl).origin).toString()
  const entryResponse = await fetcher(entryUrl, { cache: 'no-store' })
  if (!entryResponse.ok || !entryResponse.text) return undefined
  const entryDocument = await entryResponse.text()
  return entryDocument ? fingerprintModuleDocument(entryDocument) : undefined
}

/**
 * Revalidates an iframe's module revision. It only changes `src` after a
 * successful manifest response with a different revision, so an offline or
 * failing request can never replace a working persistent iframe.
 */
export async function refreshPersistentModuleIframe(
  iframe: HTMLIFrameElement,
  knownRevision: string | undefined,
  fetcher: ModuleRevisionFetcher = (url, options) => fetch(url, options),
  reloadUrl = iframe.src,
): Promise<{ revision?: string; reloaded: boolean }> {
  try {
    const revision = await fetchRevision(iframe.src, fetcher)
    if (!revision) return { revision: knownRevision, reloaded: false }
    if (knownRevision === revision) return { revision, reloaded: false }

    iframe.src = appendModuleRevision(reloadUrl, revision)
    return { revision, reloaded: true }
  } catch {
    return { revision: knownRevision, reloaded: false }
  }
}
