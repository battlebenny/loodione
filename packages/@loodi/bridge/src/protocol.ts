import type { BridgeEventType, BridgeProtocolMessage } from './types.js'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function isThemeDetail(detail: unknown): boolean {
  return isRecord(detail) && (detail.theme === 'dark' || detail.theme === 'light')
}

function isEventDetail(event: BridgeEventType, detail: unknown): boolean {
  switch (event) {
    case 'loodi:themechange':
      return isThemeDetail(detail)
    case 'loodi:tabtap':
      return isRecord(detail) && typeof detail.tabId === 'string'
    case 'loodi:navigate':
      return isRecord(detail) && typeof detail.path === 'string'
        && (detail.direction === undefined || typeof detail.direction === 'string')
    case 'loodi:config':
      return isRecord(detail)
        && typeof detail.moduleColor === 'string'
        && isRecord(detail.cssVars)
        && Object.values(detail.cssVars).every((value) => typeof value === 'string')
    case 'loodi:badgecount':
      return isRecord(detail) && isFiniteNumber(detail.count)
    case 'loodi:error':
      return isRecord(detail) && typeof detail.code === 'string'
        && (detail.recoverable === undefined || typeof detail.recoverable === 'boolean')
    case 'loodi:overlaychange':
      return isRecord(detail) && typeof detail.visible === 'boolean'
    case 'loodi:scroll':
      return isRecord(detail) && isFiniteNumber(detail.scrollY)
    case 'loodi:headeraction':
      return isRecord(detail) && typeof detail.id === 'string'
    case 'loodi:back':
      return detail === undefined
  }
}

const eventTypes = new Set<BridgeEventType>([
  'loodi:themechange',
  'loodi:tabtap',
  'loodi:navigate',
  'loodi:config',
  'loodi:badgecount',
  'loodi:error',
  'loodi:overlaychange',
  'loodi:scroll',
  'loodi:headeraction',
  'loodi:back',
])

/** Runtime schema guard used when strict postMessage validation is enabled. */
export function isBridgeProtocolMessage(value: unknown): value is BridgeProtocolMessage {
  if (!isRecord(value) || typeof value.type !== 'string') return false

  switch (value.type) {
    case 'loodi:call':
      return typeof value.method === 'string' && Array.isArray(value.args) && isFiniteNumber(value.id)
    case 'loodi:response':
      return isFiniteNumber(value.id) && (value.error === undefined || typeof value.error === 'string')
    case 'loodi:event':
      return typeof value.event === 'string'
        && eventTypes.has(value.event as BridgeEventType)
        && isEventDetail(value.event as BridgeEventType, value.detail)
    case 'loodi:ready':
      return true
    case 'loodi:navigate':
      return typeof value.path === 'string'
        && (value.direction === undefined || typeof value.direction === 'string')
    case 'loodi:overlaychange':
      return typeof value.visible === 'boolean'
    default:
      return false
  }
}
