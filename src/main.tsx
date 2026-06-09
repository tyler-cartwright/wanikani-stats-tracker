import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import App from './App.tsx'
import { checkAndUpdateVersion } from './lib/cache/version-manager'

// Record the running app version (non-destructive; logs upgrades).
// No need to gate rendering on it.
checkAndUpdateVersion().catch((error) => {
  console.error('[MAIN] Error checking app version:', error)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
