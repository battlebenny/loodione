import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { App as CapacitorApp } from '@capacitor/app'
import { Capacitor } from '@capacitor/core'
import './index.css'
import App from './App'
import { AuthProvider, completeAuthCallback, createLoodiSupabaseClient } from '@loodi/auth'

const NATIVE_AUTH_CALLBACK = 'com.loodi.one://auth/callback'

function NativeAuthCallback({ client }: { client: typeof authClient }) {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return
    let active = true
    const complete = async (url: string) => {
      if (!url.startsWith(NATIVE_AUTH_CALLBACK)) return
      try {
        await completeAuthCallback(client, url)
        if (active) window.dispatchEvent(new CustomEvent('loodi:native-auth-result', { detail: { success: true } }))
      } catch (error) {
        if (active) window.dispatchEvent(new CustomEvent('loodi:native-auth-result', { detail: { success: false, error } }))
      }
    }
    const listener = CapacitorApp.addListener('appUrlOpen', ({ url }) => { void complete(url) })
    void CapacitorApp.getLaunchUrl().then((launch) => { if (launch?.url) void complete(launch.url) })
    return () => {
      active = false
      void listener.then((handle) => handle.remove())
    }
  }, [client])

  return null
}

const authClient = createLoodiSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  storage: window.localStorage,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider client={authClient} redirectTo={Capacitor.isNativePlatform() ? NATIVE_AUTH_CALLBACK : import.meta.env.VITE_AUTH_REDIRECT_URL}>
      <NativeAuthCallback client={authClient} />
      <App />
    </AuthProvider>
  </StrictMode>,
)
