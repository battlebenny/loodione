export interface Tab {
  id: string
  icon: string
  label: string
  badgeCount?: number
}

export interface LauncherApp {
  id: string
  name: string
  icon: string
  color: string
  badgeCount: number
  active: boolean
}

export interface MiniHeaderProps {
  onSettings: () => void
  onUser: () => void
  appName?: string
  scrollProgress?: number
  showBack?: boolean
  onBack?: () => void
  menuItems?: MiniHeaderMenuItem[]
  onMenuItemSelect?: (id: string) => void
  hideActions?: boolean
}
export interface MiniHeaderMenuItem { id: string; label: string; tone?: 'default' | 'danger' }

export interface BottomNavBaseProps {
  tabs: Tab[]
  activeTab?: string
  hidden?: boolean
  onTabTap: (tabId: string) => void
  onAppsLongPress?: () => void
  onSwipeUp?: () => void
}

export type BottomNavProps = BottomNavBaseProps & (
  | { showApps?: true; onAppsTap: () => void }
  | { showApps: false; onAppsTap?: () => void }
)

export interface LauncherProps {
  apps: LauncherApp[]
  open: boolean
  onSelect: (appId: string) => void
  onClose: () => void
}

export type SharedPreferencesThemeMode = 'system' | 'light' | 'dark'

/** Presentation-only shared section, controlled by the consuming application. */
export interface SharedPreferencesSectionProps {
  themeMode: SharedPreferencesThemeMode
  resolvedTheme: 'light' | 'dark'
  onThemeModeChange: (themeMode: SharedPreferencesThemeMode) => void
  /** Lets an embedded host reserve the shell chrome while a sheet is visible. */
  onOverlayChange?: (visible: boolean) => void
  disabled?: boolean
}

/** Presentation-only entry point to the shell-owned settings. */
export interface GlobalSettingsSectionProps {
  onOpenShellSettings: () => void
  shellName?: string
}
