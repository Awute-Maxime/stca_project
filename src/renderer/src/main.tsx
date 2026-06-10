import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import frFR from 'antd/locale/fr_FR'
import App from './App'
import './assets/index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <ConfigProvider
        locale={frFR}
        theme={{
          token: {
            colorPrimary: '#1B3A6B',
            colorLink: '#2563EB',
            borderRadius: 6,
            fontFamily: "'Segoe UI', 'Arial', sans-serif"
          }
        }}
      >
        <App />
      </ConfigProvider>
    </HashRouter>
  </React.StrictMode>
)
