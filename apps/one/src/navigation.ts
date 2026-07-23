import type { NavigationDirection, NavigationRequestSource } from '@loodi/bridge'

export type NavigationPlatform = 'web' | 'android' | 'ios'

export interface NavigationRequestHandlerOptions {
  platform: NavigationPlatform
  direction: NavigationDirection
  source: NavigationRequestSource
  request: () => Promise<boolean>
  exit: () => void | Promise<void>
}

/** Runs the safe fallback only after the module has declined a correlated request. */
export async function handleNavigationRequest({ platform, direction, request, exit }: NavigationRequestHandlerOptions): Promise<void> {
  let handled = false
  try {
    handled = await request()
  } catch {
    return
  }
  if (!handled && platform === 'android' && direction === 'back') exit()
}

export function installNavigationRuntime(
  platform: NavigationPlatform,
  request: (direction: NavigationDirection, source: NavigationRequestSource) => Promise<boolean>,
  exit: () => void | Promise<void>,
  nativeApp?: { addListener: (event: 'backButton', handler: () => void) => Promise<{ remove: () => Promise<void> }> | { remove: () => Promise<void> } },
): () => void {
  const handle = (direction: NavigationDirection, source: NavigationRequestSource) => {
    void handleNavigationRequest({ platform, direction, source, request: () => request(direction, source), exit })
  }
  const onBackButton = (event: Event) => {
    event.preventDefault()
    handle('back', 'system')
  }
  const onGesture = (event: Event) => {
    const detail = (event as CustomEvent<unknown>).detail
    if (!detail || typeof detail !== 'object') return
    const { direction } = detail as { direction?: unknown }
    if (direction !== 'back' && direction !== 'forward') return
    event.preventDefault()
    handle(direction, 'gesture')
  }
  const navigationApi = (window as unknown as { navigation?: {
    currentEntry?: { index: number }
    addEventListener: (type: 'navigate', listener: (event: Event) => void) => void
    removeEventListener: (type: 'navigate', listener: (event: Event) => void) => void
  } }).navigation
  const onNavigate = (event: Event) => {
    const navigationEvent = event as Event & {
      canIntercept?: boolean
      navigationType?: string
      destination?: { index?: number }
      intercept?: (options: { handler: () => Promise<void> }) => void
    }
    const currentIndex = navigationApi?.currentEntry?.index
    const destinationIndex = navigationEvent.destination?.index
    if (navigationEvent.canIntercept !== true || navigationEvent.navigationType !== 'traverse'
      || typeof currentIndex !== 'number' || typeof destinationIndex !== 'number'
      || destinationIndex === currentIndex || !navigationEvent.intercept) return
    const direction: NavigationDirection = destinationIndex < currentIndex ? 'back' : 'forward'
    navigationEvent.intercept({ handler: async () => handle(direction, 'gesture') })
  }
  document.addEventListener('backbutton', onBackButton, { capture: true })
  window.addEventListener('loodi:navigationgesture', onGesture, { capture: true })
  navigationApi?.addEventListener('navigate', onNavigate)
  const listener = nativeApp?.addListener('backButton', () => handle('back', 'system'))
  let removeNative: (() => Promise<void>) | undefined
  void Promise.resolve(listener).then((handle) => {
    if (handle && typeof handle.remove === 'function') removeNative = handle.remove
  }).catch(() => undefined)
  return () => {
    document.removeEventListener('backbutton', onBackButton, { capture: true })
    window.removeEventListener('loodi:navigationgesture', onGesture, { capture: true })
    navigationApi?.removeEventListener('navigate', onNavigate)
    void removeNative?.()
  }
}
