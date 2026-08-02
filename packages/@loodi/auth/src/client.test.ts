import { describe, expect, it, vi } from 'vitest'

const createClient = vi.fn()
vi.mock('@supabase/supabase-js', () => ({ createClient }))

describe('createLoodiSupabaseClient', () => {
  it('uses only the public Vite configuration and disables implicit browser persistence when requested', async () => {
    const { createLoodiSupabaseClient } = await import('./client.js')

    createLoodiSupabaseClient({
      url: 'https://project.supabase.co',
      publishableKey: 'sb_publishable_test',
      storage: null,
    })

    expect(createClient).toHaveBeenCalledWith(
      'https://project.supabase.co',
      'sb_publishable_test',
      expect.objectContaining({ auth: expect.objectContaining({ persistSession: false }) }),
    )
  })

  it('rejects absent public configuration before issuing a network request', async () => {
    const { createLoodiSupabaseClient } = await import('./client.js')
    expect(() => createLoodiSupabaseClient({ url: '', publishableKey: '' })).toThrow('VITE_SUPABASE_URL')
  })
})
