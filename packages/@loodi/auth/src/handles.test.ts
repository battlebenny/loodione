import { describe, expect, it } from 'vitest'
import { DEFAULT_RESERVED_HANDLES, isValidHandle, normalizeHandle } from './handles.js'

describe('handle policy', () => {
  it('normalizes handles to their lowercase canonical form', () => {
    expect(normalizeHandle('  BoardGame_42  ')).toBe('boardgame_42')
    expect(normalizeHandle('@battle_benny')).toBe('battle_benny')
  })

  it.each(['ana', 'boardgame_42', 'a_1'])('accepts %s', (handle) => {
    expect(isValidHandle(handle)).toBe(true)
  })

  it.each(['ab', '_ana', 'ana_', 'ana--mia', 'ana.mia', 'ana mia', 'anà', '@_ana'])('rejects %s', (handle) => {
    expect(isValidHandle(handle)).toBe(false)
  })

  it('reserves platform names and all Loodi-module combinations', () => {
    expect(DEFAULT_RESERVED_HANDLES).toContain('loodi')
    expect(DEFAULT_RESERVED_HANDLES).toContain('loodimate')
    expect(DEFAULT_RESERVED_HANDLES).toContain('loodi_mate')
    expect(DEFAULT_RESERVED_HANDLES).toContain('loodi-mate')
    expect(DEFAULT_RESERVED_HANDLES).toContain('loodiplanner')
    expect(DEFAULT_RESERVED_HANDLES).not.toContain('loodisessions')
  })
})
