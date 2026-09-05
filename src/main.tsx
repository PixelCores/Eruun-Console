import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import AppInternationalization from './i18n/AppInternationalization.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppInternationalization>
        <App />
      </AppInternationalization>
    </BrowserRouter>
  </StrictMode>
)
