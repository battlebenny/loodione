import { isBridgeProtocolMessage } from '@loodi/bridge'
import type { BridgeSecurityOptions, HeaderAction, HeaderOptions, Tab } from '@loodi/bridge'

export interface ModuleInfo {
  tabs: Tab[]
  headerActions: HeaderAction[]
  headerOptions: HeaderOptions
  badgeCount: number
}

export interface BridgeServerCallbacks {
  onReady(appId: string): void
  onBadgeCount(appId: string, count: number): void
  onError(appId: string, code: string, recoverable: boolean): void
  onTabsChange(appId: string, tabs: Tab[]): void
  onHeaderActionsChange(appId: string, actions: HeaderAction[]): void
  onHeaderOptionsChange(appId: string, options: HeaderOptions): void
  onNavigate(appId: string, path: string): void
  onOverlayChange(appId: string, visible: boolean): void
  onScroll(appId: string, scrollY: number): void
  onRequestOpenApp(callerId: string, appId: string, path?: string): void
  onRequestCloseApp(callerId: string): void
  onRequestShowSwitcher(callerId: string): void
}

export interface BridgeServerOptions {
  /**
   * Legacy mode keeps the POC transport. Strict mode validates schema, source
   * and origin, and posts only to the origin declared by each iframe URL.
   */
  security?: BridgeSecurityOptions
}

export class BridgeServer {
  private modules = new Map<string, HTMLIFrameElement>()
  private moduleInfos = new Map<string, ModuleInfo>()
  private history = new Map<string, string[]>()
  private callbacks: BridgeServerCallbacks
  private strictValidation: boolean
  private allowedOrigins: ReadonlySet<string>

  constructor(callbacks: BridgeServerCallbacks, opts?: BridgeServerOptions) {
    this.callbacks = callbacks
    this.strictValidation = opts?.security?.mode === 'strict'
    this.allowedOrigins = new Set(opts?.security?.allowedOrigins ?? [])
    if (this.strictValidation && this.allowedOrigins.size === 0) {
      throw new Error('Strict bridge validation requires at least one allowed origin')
    }
    window.addEventListener('message', this.onMessage)
  }

  destroy(): void {
    window.removeEventListener('message', this.onMessage)
  }

  getModuleInfo(appId: string): ModuleInfo | undefined {
    return this.moduleInfos.get(appId)
  }

  getHistory(appId: string): string[] {
    let h = this.history.get(appId)
    if (!h) {
      h = []
      this.history.set(appId, h)
    }
    return h
  }

  registerModule(appId: string, iframe: HTMLIFrameElement): void {
    this.modules.set(appId, iframe)
    this.moduleInfos.set(appId, { tabs: [], headerActions: [], headerOptions: { hideActions: false, canGoBack: false }, badgeCount: 0 })
    this.getHistory(appId)
  }

  unregisterModule(appId: string): void {
    this.modules.delete(appId)
    this.moduleInfos.delete(appId)
    this.history.delete(appId)
  }

  postMessage(appId: string, msg: unknown): void {
    const iframe = this.modules.get(appId)
    if (!iframe?.contentWindow) return
    const targetOrigin = this.getTargetOrigin(iframe)
    if (!targetOrigin) return
    iframe.contentWindow.postMessage(msg, targetOrigin)
  }

  sendHeaderAction(appId: string, id: string): void {
    this.postMessage(appId, { type: 'loodi:event', event: 'loodi:headeraction', detail: { id } })
  }

  sendBack(appId: string): void {
    this.postMessage(appId, { type: 'loodi:event', event: 'loodi:back', detail: undefined })
  }

  broadcast(type: string, payload: Record<string, unknown>): void {
    this.modules.forEach((_, id) => {
      this.postMessage(id, { type, ...payload })
    })
  }

  private findAppId(source: WindowProxy | null): string | null {
    for (const [id, iframe] of this.modules) {
      if (iframe.contentWindow === source) return id
    }
    return null
  }

  private getTargetOrigin(iframe: HTMLIFrameElement): string | null {
    if (!this.strictValidation) return '*'
    try {
      const origin = new URL(iframe.src).origin
      return this.allowedOrigins.has(origin) ? origin : null
    } catch {
      return null
    }
  }

  private onMessage = (e: MessageEvent) => {
    const msg = e.data
    if (!msg || typeof msg !== 'object') return

    const appId = this.findAppId(e.source as WindowProxy | null)
    if (!appId) return
    if (this.strictValidation && (!this.allowedOrigins.has(e.origin) || !isBridgeProtocolMessage(msg))) return

    switch (msg.type) {
      case 'loodi:call':
        this.handleCall(appId, msg)
        break
      case 'loodi:event':
        this.handleEvent(appId, msg)
        break
      case 'loodi:overlaychange':
        this.handleEvent(appId, {
          event: 'loodi:overlaychange',
          detail: { visible: msg.visible },
        })
        break
      case 'loodi:ready':
        this.callbacks.onReady(appId)
        break
      case 'loodi:navigate':
        this.callbacks.onNavigate(appId, msg.path || '/')
        break
    }
  }

  private handleCall(appId: string, msg: { method: string; args: unknown[]; id: number }) {
    const respond = (result?: unknown, error?: string) => {
      this.postMessage(appId, { type: 'loodi:response', id: msg.id, result, error })
    }

    try {
      switch (msg.method) {
        case 'getUser':
          respond({ id: 'user-1', name: 'Moi', email: 'moi@loodi.app' })
          break
        case 'getToken':
          respond('mock-token-loodi-001')
          break
        case 'getCollection':
          respond([])
          break
        case 'getNetworkStatus':
          respond(navigator.onLine ? 'online' : 'offline')
          break
        case 'openApp': {
          const [targetAppId, path] = msg.args as [string, string | undefined]
          this.callbacks.onRequestOpenApp(appId, targetAppId, path)
          respond(undefined)
          break
        }
        case 'closeApp':
          this.callbacks.onRequestCloseApp(appId)
          respond(undefined)
          break
        case 'showAppSwitcher':
          this.callbacks.onRequestShowSwitcher(appId)
          respond(undefined)
          break
        case 'setBottomNav': {
          const [tabs] = msg.args as [Tab[]]
          if (!Array.isArray(tabs) || !tabs.every(isTab)) throw new Error('Bottom navigation tabs must be an array of tabs')
          this.moduleInfos.set(appId, {
            ...(this.moduleInfos.get(appId) ?? { headerActions: [], headerOptions: { hideActions: false, canGoBack: false }, badgeCount: 0 }),
            tabs,
          })
          this.callbacks.onTabsChange(appId, tabs)
          respond(undefined)
          break
        }
        case 'setHeaderActions': {
          const [actions] = msg.args as [HeaderAction[]]
          if (!Array.isArray(actions)) throw new Error('Header actions must be an array')
          this.moduleInfos.set(appId, {
            ...(this.moduleInfos.get(appId) ?? { tabs: [], headerOptions: { hideActions: false, canGoBack: false }, badgeCount: 0 }),
            headerActions: actions,
          })
          this.callbacks.onHeaderActionsChange(appId, actions)
          respond(undefined)
          break
        }
        case 'setHeaderOptions': {
          const [options] = msg.args as [HeaderOptions]
          if (!options || typeof options !== 'object' || Array.isArray(options)) {
            throw new Error('Header options must be an object')
          }
          const headerOptions = {
            hideActions: options.hideActions === true,
            canGoBack: options.canGoBack === true,
          }
          this.moduleInfos.set(appId, {
            ...(this.moduleInfos.get(appId) ?? { tabs: [], headerActions: [], badgeCount: 0 }),
            headerOptions,
          })
          this.callbacks.onHeaderOptionsChange(appId, headerOptions)
          respond(undefined)
          break
        }
        case 'queueAction':
          console.log('[Loodi] Queue action', msg.args[0])
          respond(undefined)
          break
        default:
          respond(undefined, `Unknown method: ${msg.method}`)
      }
    } catch (e) {
      respond(undefined, (e as Error).message)
    }
  }

  private handleEvent(appId: string, msg: { event: string; detail?: Record<string, unknown> }) {
    const d = msg.detail
    switch (msg.event) {
      case 'loodi:badgecount':
        if (typeof d?.count === 'number') this.callbacks.onBadgeCount(appId, d.count)
        break
      case 'loodi:error':
        this.callbacks.onError(appId, (d?.code as string) || 'ERR_UNKNOWN', (d?.recoverable as boolean) ?? true)
        break
      case 'loodi:overlaychange':
        if (typeof d?.visible === 'boolean') this.callbacks.onOverlayChange(appId, d.visible)
        break
      case 'loodi:scroll':
        if (typeof d?.scrollY === 'number') this.callbacks.onScroll(appId, d.scrollY)
        break
    }
  }
}

function isTab(value: unknown): value is Tab {
  return typeof value === 'object'
    && value !== null
    && typeof (value as Tab).id === 'string'
    && typeof (value as Tab).icon === 'string'
    && typeof (value as Tab).label === 'string'
}
