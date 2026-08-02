import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const migrationUrl = new URL('../../../../supabase/migrations/20260731180000_auth_foundation.sql', import.meta.url)

describe('Supabase auth foundation migration', () => {
  it('creates profiles, editable handle reservations and owner-only RLS', () => {
    const sql = readFileSync(migrationUrl, 'utf8')

    expect(sql).toContain('create table public.profiles')
    expect(sql).toContain('create table public.reserved_module_names')
    expect(sql).toContain('enable row level security')
    expect(sql).toContain('auth.uid() = id')
    expect(sql).toContain("handle = lower(btrim(handle))")
  })

  it('persists one of the approved player profile colours', () => {
    const profileColorMigration = readFileSync(new URL('../../../../supabase/migrations/20260802090000_profile_color.sql', import.meta.url), 'utf8')

    expect(profileColorMigration).toContain('add column profile_color')
    expect(profileColorMigration).toContain("check (profile_color in")
  })

  it('can evolve the player palette without rewriting an applied migration', () => {
    const paletteMigration = readFileSync(new URL('../../../../supabase/migrations/20260802100000_profile_color_palette.sql', import.meta.url), 'utf8')

    expect(paletteMigration).toContain('drop constraint if exists profiles_profile_color_check')
    expect(paletteMigration).toContain("check (profile_color in")
  })

  it('adds the neutral profile colours in a new migration', () => {
    const neutralPaletteMigration = readFileSync(new URL('../../../../supabase/migrations/20260802110000_profile_color_neutrals.sql', import.meta.url), 'utf8')

    expect(neutralPaletteMigration).toContain("'#F5F5F0'")
    expect(neutralPaletteMigration).toContain("'#1A1A18'")
    expect(neutralPaletteMigration).toContain("'#777770'")
    expect(neutralPaletteMigration).toContain("'#B0AEA6'")
  })
})
