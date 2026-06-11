import { useState, useEffect } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { ConfigProvider, theme } from 'antd'
import frFR from 'antd/locale/fr_FR'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { renderWindowContent } from '@windows/WindowContent'
import { electronApi } from '@api/electron'

type DragCSS = CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }
type BtnType  = 'minimize' | 'maximize' | 'close'

const BTN_CFG: Record<BtnType, { sym: string; label: string; hoverBg: string; hoverColor: string }> = {
  minimize: { sym: '─', label: 'Réduire',  hoverBg: 'rgba(255,255,255,0.1)',  hoverColor: '#9BB5CF' },
  maximize: { sym: '□', label: 'Agrandir', hoverBg: 'rgba(79,156,249,0.15)', hoverColor: '#4F9CF9' },
  close:    { sym: '✕', label: 'Fermer',   hoverBg: 'rgba(239,68,68,0.2)',   hoverColor: '#EF4444' },
}

function TitleBtn({ type, onClick }: { type: BtnType; onClick: () => void }): JSX.Element {
  const cfg = BTN_CFG[type]
  const [hov, setHov] = useState(false)
  return (
    <button
      aria-label={cfg.label}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 28, height: 22, border: 'none', outline: 'none',
        background:  hov ? cfg.hoverBg    : 'transparent',
        color:       hov ? cfg.hoverColor : 'rgba(255,255,255,0.28)',
        fontSize: 11, cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 4, transition: 'all 0.15s',
      }}
    >
      {cfg.sym}
    </button>
  )
}

export default function MdiWindowHost(): JSX.Element {
  const { id } = useParams<{ id: string }>()

  // Apply dark class to body so Ant Design portals (dropdowns, pickers) also get dark styles
  useEffect(() => {
    document.body.classList.add('mdi-dark')
    return () => document.body.classList.remove('mdi-dark')
  }, [])

  if (!id) {
    return <div style={{ padding: 20, color: '#EF4444', background: '#080f1d' }}>Fenêtre introuvable</div>
  }

  const config = WINDOW_REGISTRY[id]
  const title  = config?.title ?? id

  return (
    <ConfigProvider
      locale={frFR}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary:         '#4F9CF9',
          colorBgContainer:     'rgba(255,255,255,0.06)',
          colorBgElevated:      '#0D1B30',
          colorText:            '#E8EDF5',
          colorTextPlaceholder: '#3D5570',
          colorBorder:          'rgba(255,255,255,0.1)',
          borderRadius:         6,
          fontSize:             12,
        },
      }}
    >
      <div
        className="mdi-dark"
        style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#080f1d' }}
      >
        {/* ── Title bar ─────────────────────────────────────────────── */}
        <div style={{
          height: 32, flexShrink: 0,
          background: 'linear-gradient(180deg, #0E1E35 0%, #070F1C 100%)',
          borderBottom: '1px solid rgba(79,156,249,0.16)',
          boxShadow: '0 2px 16px rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center',
          padding: '0 2px 0 10px',
          userSelect: 'none',
          WebkitAppRegion: 'drag',
        } as DragCSS}>

          {/* Accent dot */}
          <div style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: '#4F9CF9',
            boxShadow: '0 0 8px rgba(79,156,249,0.8)',
            marginRight: 8,
          }} />

          <span style={{
            color: '#7A9BBC', fontSize: 11, fontWeight: 600,
            letterSpacing: 0.5, flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {title}
          </span>

          <div
            style={{ display: 'flex', gap: 0, WebkitAppRegion: 'no-drag' } as DragCSS}
            onMouseDown={e => e.stopPropagation()}
          >
            <TitleBtn type="minimize" onClick={() => electronApi.mdiSelfMinimize()} />
            <TitleBtn type="maximize" onClick={() => electronApi.mdiSelfMaximize()} />
            <TitleBtn type="close"    onClick={() => electronApi.mdiSelfClose()} />
          </div>
        </div>

        {/* ── Content ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflow: 'auto', background: '#080f1d', padding: 8 }}>
          {renderWindowContent(id)}
        </div>
      </div>
    </ConfigProvider>
  )
}
