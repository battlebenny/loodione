import { createClient, type SupabaseClient } from '@supabase/supabase-js'

declare global {
  interface ImportMeta {
    readonly env?: Record<string, string | undefined>
  }
}

export interface AuthStorage {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export interface LoodiSupabaseClientOptions {
  url?: string
  publishableKey?: string
  /** null keeps the session in memory; pass localStorage only in standalone PWAs. */
  storage?: AuthStorage | null
}

function required(value: string | undefined, name: string): string {
  if (value?.trim()) return value
  throw new Error(`${name} is required to initialize Supabase authentication`)
}

export function createLoodiSupabaseClient(options: LoodiSupabaseClientOptions = {}): SupabaseClient {
  const url = required(options.url ?? import.meta.env?.VITE_SUPABASE_URL, 'VITE_SUPABASE_URL')
  const publishableKey = required(
    options.publishableKey ?? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY,
    'VITE_SUPABASE_PUBLISHABLE_KEY',
  )
  const storage = options.storage ?? null

  return createClient(url, publishableKey, {
    auth: {
      persistSession: storage !== null,
      storage: storage ?? undefined,
    },
  })
}
