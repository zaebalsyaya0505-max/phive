import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import { SupabaseProvider } from '@/providers/SupabaseProvider'
import { TonConnectProvider } from '@/providers/TonConnectProvider'

createRoot(document.getElementById('root')!).render(
  <HashRouter>
    <SupabaseProvider>
      <TonConnectProvider>
        <App />
      </TonConnectProvider>
    </SupabaseProvider>
  </HashRouter>,
)
