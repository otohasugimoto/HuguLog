import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

import { FamilyProvider } from './contexts/FamilyContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FamilyProvider>
      <App />
    </FamilyProvider>
  </StrictMode>,
)
