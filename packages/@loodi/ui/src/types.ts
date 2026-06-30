export interface Tab {
  id: string
  icon: string
  label: string
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
}

export interface BottomNavProps {
  tabs: Tab[]
  activeTab?: string
  onTabTap: (tabId: string) => void
  onAppsTap: () => void
}

export interface LauncherProps {
  apps: LauncherApp[]
  open: boolean
  onSelect: (appId: string) => void
  onClose: () => void
}
