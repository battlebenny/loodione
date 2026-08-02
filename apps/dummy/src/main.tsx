import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@loodi/ui/styles.css'
import { AuthProvider, createLoodiSupabaseClient } from '@loodi/auth'
import { DummyApp } from './DummyApp'
import { bootstrapDummySafeArea } from './safeArea'

bootstrapDummySafeArea()

const authClient = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  ? createLoodiSupabaseClient({ storage: window.localStorage })
  : null

const app = (
  <StrictMode>
    <DummyApp />
  </StrictMode>
)

createRoot(document.getElementById('root')!).render(
  authClient ? <AuthProvider client={authClient}>{app}</AuthProvider> : app,
)
