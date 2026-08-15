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

export type SharedThemeMode = 'system' | 'light' | 'dark'

/** Closed model owned by One while a module runs inside the shell. */
export interface SharedPreferences {
  themeMode: SharedThemeMode
  resolvedTheme: 'light' | 'dark'
  revision: number
}

export interface SharedPreferencesUpdate {
  themeMode: SharedThemeMode
}

export interface AuthSession {
  userId: string
  accessToken: string
  expiresAt: number
  handle?: string
}

export type NavigationDirection = 'back' | 'forward'
export type NavigationRequestSource = 'gesture' | 'system'

export interface NavigationRequest {
  requestId: string
  direction: NavigationDirection
  source: NavigationRequestSource
}

export interface NavigationResult {
  requestId: string
  handled: boolean
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
  getAuthSession(): AuthSession | null
  getCollection(): unknown[]
  getNetworkStatus(): 'online' | 'offline'
  openApp(appId: string, path?: string): void
  closeApp(): void
  showAppSwitcher(): void
  setBottomNav(tabs: Tab[]): void
  setHeaderActions(actions: HeaderAction[]): void
  setHeaderOptions(options: HeaderOptions): void
  setSettingsCapability(supportsEmbeddedSettings: boolean): void
  setNavigationGestureCapability(enabled: boolean): void
  getSharedPreferences(): SharedPreferences
  updateSharedPreferences(update: SharedPreferencesUpdate): SharedPreferences
  showShellSettings(): void
  showAuth(): void
  showLoodiAccount(): void
  queueAction(action: unknown): void
  requestPermission(kind: 'camera' | 'geolocation'): 'granted' | 'denied'
}

export interface BridgeEvents {
  'loodi:authchange': AuthSession | null
  'loodi:themechange': { theme: 'dark' | 'light' }
  'loodi:tabtap': { tabId: string }
  'loodi:navigate': { path: string; direction?: string }
  'loodi:config': { moduleColor: string; cssVars: Record<string, string> }
  /** Target tab is optional only for legacy one-tab module navigations. */
  'loodi:badgecount': { count: number; tabId?: string }
  'loodi:error': { code: string; recoverable?: boolean }
  'loodi:overlaychange': { visible: boolean }
  'loodi:scroll': { scrollY: number }
  'loodi:headeraction': { id: string }
  'loodi:back': undefined
  'loodi:settingsopen': undefined
  'loodi:settingsopenresult': { opened: boolean }
  'loodi:preferenceschange': SharedPreferences
  'loodi:navigationrequest': NavigationRequest
  'loodi:navigationresult': NavigationResult
}

export type BridgeEventType = keyof BridgeEvents

export type BridgeProtocolMessage =
  | BridgeCall
  | BridgeResponse
  | { type: 'loodi:event'; event: BridgeEventType; detail?: unknown }
  | { type: 'loodi:ready' }
  | { type: 'loodi:navigate'; path: string; direction?: string }
  | { type: 'loodi:overlaychange'; visible: boolean }
