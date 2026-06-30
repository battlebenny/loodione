import type { BridgeMethods, BridgeEvents, BridgeEventType } from './types'

interface PendingCall {
  resolve: (value: unknown) => void
  reject: (reason: unknown) => void
  timeout: ReturnType<typeof setTimeout>
}

export class BridgeClient {
  private callId = 0
  private pending = new Map<number, PendingCall>()
  private listeners = new Map<string, Set<(detail: unknown) => void>>()
  private shellOrigin: string
  private mode: 'iframe' | 'standalone'

  constructor(opts?: { shellOrigin?: string }) {
    this.shellOrigin = opts?.shellOrigin ?? '*'
    this.mode = this.detectMode()
    if (this.mode === 'iframe') {
      window.addEventListener('message', this.onMessage)
    }
  }

  private detectMode(): 'iframe' | 'standalone' {
    try {
      return window.self !== window.top ? 'iframe' : 'standalone'
    } catch {
      return 'standalone'
    }
  }

  private onMessage = (e: MessageEvent) => {
    const msg = e.data
    if (!msg || typeof msg !== 'object') return

    if (msg.type === 'loodi:response') {
      const pending = this.pending.get(msg.id)
      if (!pending) return
      clearTimeout(pending.timeout)
      this.pending.delete(msg.id)
      if (msg.error) {
        pending.reject(new Error(msg.error))
      } else {
        pending.resolve(msg.result)
      }
      return
    }

    if (msg.type === 'loodi:event') {
      const { event, detail } = msg
      const handlers = this.listeners.get(event)
      if (handlers) {
        handlers.forEach((fn) => fn(detail))
      }
    }
  }

  async call<M extends keyof BridgeMethods>(
    method: M,
    ...args: Parameters<BridgeMethods[M]>
  ): Promise<ReturnType<BridgeMethods[M]>> {
    if (this.mode === 'standalone') {
      return this.handleStandalone(method, args) as ReturnType<BridgeMethods[M]>
    }

    return new Promise((resolve, reject) => {
      const id = ++this.callId
      const timeout = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Bridge call "${String(method)}" timed out`))
      }, 10000)

      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject, timeout })
      window.parent.postMessage(
        { type: 'loodi:call', method, args, id },
        this.shellOrigin,
      )
    })
  }

  private handleStandalone(_method: string, _args: unknown[]): unknown {
    switch (_method) {
      case 'getUser':
        return { id: 'local', name: 'Local', email: 'local@loodi.app' }
      case 'getToken':
        return null
      case 'getNetworkStatus':
        return navigator.onLine ? 'online' : 'offline'
      default:
        return undefined
    }
  }

  emit<E extends BridgeEventType>(event: E, detail: BridgeEvents[E]): void {
    if (this.mode !== 'iframe') return
    window.parent.postMessage(
      { type: 'loodi:event', event, detail },
      this.shellOrigin,
    )
  }

  on<E extends BridgeEventType>(
    event: E,
    handler: (detail: BridgeEvents[E]) => void,
  ): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(handler as (detail: unknown) => void)
    return () => {
      this.listeners.get(event)?.delete(handler as (detail: unknown) => void)
    }
  }

  destroy(): void {
    window.removeEventListener('message', this.onMessage)
    this.pending.forEach((p) => clearTimeout(p.timeout))
    this.pending.clear()
    this.listeners.clear()
  }
}
