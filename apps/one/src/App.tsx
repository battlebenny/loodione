import { MiniHeader, BottomNav, Launcher } from '@loodi/ui'
import { useShell } from './useShell'
import { Settings } from './Settings'
import type { LauncherApp } from '@loodi/ui'

function App() {
  const { state, themeMode, setThemeMode, toggleLauncher, activateApp, toggleSettings } = useShell()

  const launcherApps: LauncherApp[] = state.apps
    .filter((a) => a.url)
    .map((a) => ({
      id: a.id,
      name: a.name,
      icon: a.icon,
      color: a.color,
      active: state.activeAppId === a.id,
      badgeCount: 0,
    }))

  return (
    <div className="h-dvh bg-[#f1f1ef] dark:bg-[#1a1a18] text-[#353533] dark:text-[#e8e7e4] overflow-hidden">
      <MiniHeader
        onSettings={toggleSettings}
        onUser={() => {}}
      />

      <div
        id="module-container"
        className="relative w-full h-full overflow-hidden"
      >
        {state.apps.filter((a) => a.url).map((app) => (
          <iframe
            key={app.id}
            data-app={app.id}
            src={app.url! + (app.url!.includes('?') ? '&' : '?') + 'loodi-shell=1'}
            className={`absolute inset-0 w-full h-full border-0 ${state.activeAppId === app.id ? 'z-10' : 'z-0 pointer-events-none opacity-0'}`}
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            title={app.name}
          />
        ))}
      </div>

      <BottomNav
        tabs={state.tabs}
        activeTab={state.activeTab}
        onTabTap={(tabId) => {
          const iframe = document.querySelector<HTMLIFrameElement>(`iframe[data-app="${state.activeAppId}"]`)
          iframe?.contentWindow?.postMessage({ type: 'loodi:tabtap', tabId }, '*')
        }}
        onAppsTap={toggleLauncher}
      />

      <Launcher
        apps={launcherApps}
        open={state.launcherOpen}
        onSelect={(appId) => {
          toggleLauncher()
          activateApp(appId)
        }}
        onClose={toggleLauncher}
      />

      {state.settingsOpen && (
        <Settings
          themeMode={themeMode}
          onThemeChange={setThemeMode}
          onClose={toggleSettings}
        />
      )}
    </div>
  )
}

export default App
