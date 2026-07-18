/** Types du bridge Loodi-One */

export interface Tab {
  id: string
  icon: string
  label: string
}

export interface HeaderAction {
  id: string
  label: string
  tone?: 'default' | 'danger'
}

export interface HeaderOptions {
  hideActions?: boolean
  canGoBack?: boolean
}

export interface BridgeCall {
  type: 'loodi:call'
  method: string
  args: unknown[]
  id: number
}

export interface BridgeResponse {
  type: 'loodi:response'
  id: number
  result?: unknown
  error?: string
}

/**
 * Transport hardening is opt-in while modules still use the legacy POC
 * transport. Strict mode requires exact origins on both sides of the bridge.
 */
export interface BridgeSecurityOptions {
  mode?: 'legacy' | 'strict'
  allowedOrigins?: readonly string[]
}

export interface BridgeClientOptions {
  /** Explicit origin of the One shell, used as postMessage targetOrigin. */
  targetOrigin?: string
  /** @deprecated Use targetOrigin. Kept for modules already using this option. */
  shellOrigin?: string
  security?: Pick<BridgeSecurityOptions, 'mode'>
}

export interface BridgeMethods {
  getUser(): { id: string; name: string; email: string; avatar?: string }
  getToken(): string | null
  getCollection(): unknown[]
  getNetworkStatus(): 'online' | 'offline'
  openApp(appId: string, path?: string): void
  closeApp(): void
  showAppSwitcher(): void
  setBottomNav(tabs: Tab[]): void
  setHeaderActions(actions: HeaderAction[]): void
  setHeaderOptions(options: HeaderOptions): void
  queueAction(action: unknown): void
  requestPermission(kind: 'camera' | 'geolocation'): 'granted' | 'denied'
}

export interface BridgeEvents {
  'loodi:themechange': { theme: 'dark' | 'light' }
  'loodi:tabtap': { tabId: string }
  'loodi:navigate': { path: string; direction?: string }
  'loodi:config': { moduleColor: string; cssVars: Record<string, string> }
  'loodi:badgecount': { count: number }
  'loodi:error': { code: string; recoverable?: boolean }
  'loodi:overlaychange': { visible: boolean }
  'loodi:scroll': { scrollY: number }
  'loodi:headeraction': { id: string }
  'loodi:back': undefined
}

export type BridgeEventType = keyof BridgeEvents

export type BridgeProtocolMessage =
  | BridgeCall
  | BridgeResponse
  | { type: 'loodi:event'; event: BridgeEventType; detail?: unknown }
  | { type: 'loodi:ready' }
  | { type: 'loodi:navigate'; path: string; direction?: string }
  | { type: 'loodi:overlaychange'; visible: boolean }
