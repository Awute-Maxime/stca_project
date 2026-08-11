import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import frFR from 'antd/locale/fr_FR'
import App from './App'
import './assets/index.css'
import { useBranding } from './theme/useBranding'
import { construireAntdTheme } from './theme/windev-theme'
import { resoudreTheme } from '../../shared/branding'
import { prefereSombreOS } from './theme/appliquerBranding'

function Racine(): JSX.Element {
  const cfg = useBranding()
  const sombre = resoudreTheme(cfg.apparence.theme, prefereSombreOS()) === 'sombre'
  return (
    <ConfigProvider locale={frFR} theme={construireAntdTheme(sombre, cfg.apparence.couleurAccent)}>
      <App />
    </ConfigProvider>
  )
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <Racine />
    </HashRouter>
  </React.StrictMode>
)
