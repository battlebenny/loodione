const SAFE_AREA_STORAGE_KEY = 'loodi:dummy:safe-area'

export interface DummyShellSafeArea {
  isShell: boolean
  headerHeight: number
  bottomNavHeight: number
}

function toPixels(value: number): string {
  return Number.isFinite(value) && value >= 0 ? `${value}px` : '0px'
}

function readStoredSafeArea(): DummyShellSafeArea | null {
  try {
    const stored: unknown = JSON.parse(window.localStorage.getItem(SAFE_AREA_STORAGE_KEY) ?? 'null')
    if (!stored || typeof stored !== 'object') return null
    const value = stored as DummyShellSafeArea
    if (!Number.isFinite(value.headerHeight) || !Number.isFinite(value.bottomNavHeight)) return null
    if (value.headerHeight < 0 || value.bottomNavHeight < 0) return null
    return { isShell: true, headerHeight: value.headerHeight, bottomNavHeight: value.bottomNavHeight }
  } catch {
    return null
  }
}

function persistSafeArea(safeArea: DummyShellSafeArea): void {
  if (!safeArea.isShell) return
  try {
    window.localStorage.setItem(SAFE_AREA_STORAGE_KEY, JSON.stringify({
      headerHeight: safeArea.headerHeight,
      bottomNavHeight: safeArea.bottomNavHeight,
    }))
  } catch {
    // The current page keeps its safe-area values even when storage is blocked.
  }
}

function isEmbeddedWindow(): boolean {
  try {
    return window.self !== window.top
  } catch {
    return false
  }
}

export function readDummyShellSafeArea(search = window.location.search): DummyShellSafeArea {
  const params = new URLSearchParams(search)
  const isShell = params.get('loodi-shell') === '1'
  return {
    isShell,
    headerHeight: Math.max(0, Number(params.get('headerHeight') ?? 0) || 0),
    bottomNavHeight: Math.max(0, Number(params.get('bottomNavHeight') ?? 0) || 0),
  }
}

export function applyDummyShellSafeArea(safeArea: DummyShellSafeArea): void {
  document.documentElement.style.setProperty('--shell-safe-top', safeArea.isShell ? toPixels(safeArea.headerHeight) : '0px')
  document.documentElement.style.setProperty('--shell-safe-bottom', safeArea.isShell ? toPixels(safeArea.bottomNavHeight) : '0px')
}

/** Restores clearances after an in-iframe route or process restoration. */
export function bootstrapDummySafeArea(): DummyShellSafeArea {
  const fromUrl = readDummyShellSafeArea()
  if (fromUrl.isShell) {
    persistSafeArea(fromUrl)
    applyDummyShellSafeArea(fromUrl)
    return fromUrl
  }

  const restored = isEmbeddedWindow() ? readStoredSafeArea() : null
  const safeArea = restored ?? { isShell: false, headerHeight: 0, bottomNavHeight: 0 }
  applyDummyShellSafeArea(safeArea)
  return safeArea
}
