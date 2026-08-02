import { BridgeClient } from '@loodi/bridge'
import type {
  BridgeEventType,
  BridgeEvents,
  HeaderOptions,
  BridgeMethods,
  SharedPreferences,
  SharedPreferencesUpdate,
  Tab,
} from '@loodi/bridge'

export interface DummyBridge {
  call<M extends keyof BridgeMethods>(method: M, ...args: Parameters<BridgeMethods[M]>): Promise<ReturnType<BridgeMethods[M]>>
  ready(): void
  destroy(): void
  setBottomNav(tabs: Tab[]): Promise<void>
  setHeaderOptions(options: HeaderOptions): Promise<void>
  setSettingsCapability(supportsEmbeddedSettings: boolean): Promise<void>
  getSharedPreferences(): Promise<SharedPreferences>
  updateSharedPreferences(update: SharedPreferencesUpdate): Promise<SharedPreferences>
  showShellSettings(): Promise<void>
  showLoodiAccount(): Promise<void>
  emit<E extends BridgeEventType>(event: E, detail: BridgeEvents[E]): void
  on<E extends BridgeEventType>(event: E, handler: (detail: BridgeEvents[E]) => void): () => void
}

const KNOWN_SHELL_ORIGINS = new Set(['https://one.loodi.test:4001', 'https://app'])

function explicitOrigin(value: string | undefined): string | null {
  if (!value) return null
  try {
    const origin = new URL(value).origin
    return KNOWN_SHELL_ORIGINS.has(origin) ? origin : null
  } catch {
    return null
  }
}

export function resolveDummyShellOrigin(referrer = document.referrer): string | null {
  const referrerOrigin = explicitOrigin(referrer)
  if (referrerOrigin) return referrerOrigin
  return explicitOrigin(import.meta.env.VITE_LOODI_SHELL_ORIGIN)
}

export function createDummyBridge(): DummyBridge {
  const targetOrigin = resolveDummyShellOrigin()
  if (!targetOrigin) throw new Error('Loodi One shell origin is not configured for Dummy')
  return new BridgeClient({ targetOrigin, security: { mode: 'strict' } })
}

/** A permissive bridge retains the diagnostic tools when Dummy runs on its own. */
export function createStandaloneDummyBridge(): DummyBridge {
  return new BridgeClient()
}
