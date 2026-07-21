import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@loodi/ui/styles.css'
import { DummyApp } from './DummyApp'
import { bootstrapDummySafeArea } from './safeArea'

bootstrapDummySafeArea()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DummyApp />
  </StrictMode>,
)
