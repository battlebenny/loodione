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
  /** When present, renders the authenticated player's monogram avatar. */
  userInitial?: string
  /** Temporary deterministic avatar tint, until players can choose one. */
  userAvatarColor?: string
  appName?: string
  scrollProgress?: number
  showBack?: boolean
  onBack?: () => void
  menuItems?: MiniHeaderMenuItem[]
  onMenuItemSelect?: (id: string) => void
  hideActions?: boolean
  /** Places shell chrome below an overlay rendered inside a module iframe. */
  behindOverlay?: boolean
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
  /** Shell-owned settings are irrelevant in standalone applications. */
  showShellSettings?: boolean
  onOpenShellSettings?: () => void
  onOpenLoodiAccount: () => void
  settingDescription?: string
}

/** Presentation-only entry point to the module-owned player QR code page. */
export interface PlayerQrCodeSectionProps {
  onOpenQrCode: () => void
  disabled?: boolean
}

/** Auth-provider agnostic account management screen for embedded and standalone apps. */
export interface LoodiAccountPageProps {
  isAuthenticated: boolean
  playerName?: string
  profileColor?: string
  email?: string | null
  hasGoogleIdentity?: boolean
  onCreateAccount: () => void
  onSignIn: () => void
  onSignOut?: () => Promise<void>
  onDeleteAccount?: () => Promise<void>
  onUpdateEmail?: (email: string) => Promise<void>
  onLinkGoogleIdentity?: () => Promise<void>
  onUnlinkGoogleIdentity?: () => Promise<void>
  onUpdateProfileColor?: (color: string) => Promise<void>
  /** Lets the host hide its navigation while an account sheet is visible. */
  onOverlayChange?: (visible: boolean) => void
  /** A one-shot confirmation supplied by the host after an OAuth redirect. */
  successMessage?: string
}

export type AuthBottomSheetState = 'anonymous' | 'handle-required'

/** Controlled authentication sheet. Authentication, routing and persistence stay in the host. */
export interface AuthBottomSheetProps {
  open: boolean
  state: AuthBottomSheetState
  onClose: () => void
  onSignInWithGoogle: () => Promise<void>
  onSignInWithMagicLink: (email: string) => Promise<void>
  onCompleteHandle: (handle: string) => Promise<void>
  onAbandonIncompleteAccount: () => Promise<void>
  onOverlayChange?: (visible: boolean) => void
}

/** Controlled sheet for the authenticated player’s entry points. */
export interface AccountBottomSheetProps {
  open: boolean
  playerName?: string
  onClose: () => void
  onOpenAccount: () => void
  onSignOut: () => Promise<void>
  onOverlayChange?: (visible: boolean) => void
}
