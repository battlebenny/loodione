export interface AppEntry {
  id: string
  name: string
  icon: string
  url: string | null
  color: string
}

export const APPS: AppEntry[] = [
  { id: 'loodi', name: 'Loodi', icon: '🎲', url: 'https://loodi.vercel.app', color: '#ca4a16' },
  { id: 'loodi-mate', name: 'Mate', icon: '🃏', url: null, color: '#2E8B57' },
  { id: 'loodi-mag', name: 'Mag', icon: '📰', url: null, color: '#4A90D9' },
  { id: 'loodi-places', name: 'Places', icon: '📍', url: null, color: '#9B59B6' },
  { id: 'loodi-fest', name: 'Fest', icon: '🎪', url: null, color: '#E67E22' },
  { id: 'loodi-sessions', name: 'Sessions', icon: '👥', url: null, color: '#1ABC9C' },
  { id: 'loodi-dev', name: 'Dev', icon: '⚙️', url: 'http://localhost:8080/dev/dummy.html', color: '#6B7280' },
]

// ponytail: URL à remplacer par l'URL réelle du fichier de config
export const APPS_CONFIG_URL = 'https://apps.loodi.app/config.json'

export async function fetchAppsFromConfig(): Promise<AppEntry[]> {
  try {
    const res = await fetch(APPS_CONFIG_URL)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const remote: AppEntry[] = await res.json()
    if (!Array.isArray(remote)) throw new Error('invalid config')
    // Merge: remote entries override locals by id, locals fill gaps
    const map = new Map(APPS.map((a) => [a.id, a]))
    for (const app of remote) {
      if (app.id && app.url) map.set(app.id, app)
    }
    return Array.from(map.values())
  } catch {
    return APPS
  }
}
