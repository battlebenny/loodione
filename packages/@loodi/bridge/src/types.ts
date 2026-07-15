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
