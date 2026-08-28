export const HANDLE_PATTERN = /^(?=.{3,24}$)[a-z0-9](?:[a-z0-9_]*[a-z0-9])?$/

export const RESERVED_MODULE_NAMES = [
  'collec',
  'mate',
  'mag',
  'places',
  'fest',
  'planner',
  'friends',
] as const

const platformReservedHandles = [
  'admin',
  'administrator',
  'api',
  'auth',
  'support',
  'help',
  'contact',
  'system',
  'root',
  'moderation',
  'team',
  'loodi',
]

function moduleHandleVariants(moduleName: string): string[] {
  return [`loodi${moduleName}`, `loodi_${moduleName}`, `loodi-${moduleName}`]
}

export const DEFAULT_RESERVED_HANDLES = [
  ...platformReservedHandles,
  ...RESERVED_MODULE_NAMES.flatMap(moduleHandleVariants),
]

export function normalizeHandle(value: string): string {
  return value.trim().replace(/^@/, '').toLowerCase()
}

export function isValidHandle(value: string): boolean {
  return HANDLE_PATTERN.test(normalizeHandle(value))
}
