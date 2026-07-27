import { Capacitor, SystemBars, SystemBarsStyle, SystemBarType } from '@capacitor/core'

export async function syncStatusBarTheme(theme: 'dark' | 'light'): Promise<void> {
  if (!Capacitor.isNativePlatform()) return

  await SystemBars.setStyle({
    bar: SystemBarType.StatusBar,
    style: theme === 'dark' ? SystemBarsStyle.Dark : SystemBarsStyle.Light,
  })
}
