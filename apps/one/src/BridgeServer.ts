import type { Tab } from '@loodi/bridge'

export interface ModuleInfo {
  tabs: Tab[]
  badgeCount: number
}

export interface BridgeServerCallbacks {
  onReady(appId: string): void
  onBadgeCount(appId: string, count: number): void
  onError(appId: string, code: string, recoverable: boolean): void
  onTabsChange(appId: string, tabs: Tab[]): void
  onNavigate(appId: string, path: string): void
  onRequestOpenApp(callerId: string, appId: string, path?: string): void
  onRequestCloseApp(callerId: string): void
  onRequestShowSwitcher(callerId: string): void
}

export class BridgeServer {
  private modules = new Map<string, HTMLIFrameElement>()
  private moduleInfos = new Map<string, ModuleInfo>()
  private history = new Map<string, string[]>()
  private callbacks: BridgeServerCallbacks
  constructor(callbacks: BridgeServerCallbacks) {
    this.callbacks = callbacks
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
    this.moduleInfos.set(appId, { tabs: [], badgeCount: 0 })
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
    iframe.contentWindow.postMessage(msg, '*')
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

  private onMessage = (e: MessageEvent) => {
    const msg = e.data
    if (!msg || typeof msg !== 'object') return

    const appId = this.findAppId(e.source as WindowProxy | null)
    if (!appId) return

    switch (msg.type) {
      case 'loodi:call':
        this.handleCall(appId, msg)
        break
      case 'loodi:event':
        this.handleEvent(appId, msg)
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
          this.callbacks.onTabsChange(appId, tabs)
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
      case 'loodi:ready':
        this.callbacks.onReady(appId)
        break
      case 'loodi:badgecount':
        if (typeof d?.count === 'number') this.callbacks.onBadgeCount(appId, d.count)
        break
      case 'loodi:error':
        this.callbacks.onError(appId, (d?.code as string) || 'ERR_UNKNOWN', (d?.recoverable as boolean) ?? true)
        break
    }
  }
}
