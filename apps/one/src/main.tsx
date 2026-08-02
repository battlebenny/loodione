import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'
import { AuthProvider, createLoodiSupabaseClient } from '@loodi/auth'

const authClient = createLoodiSupabaseClient({
  url: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  storage: window.localStorage,
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider client={authClient} redirectTo={import.meta.env.VITE_AUTH_REDIRECT_URL}>
      <App />
    </AuthProvider>
  </StrictMode>,
)
