import { useState } from 'react'
import type { CSSProperties } from 'react'
import { useParams } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import frFR from 'antd/locale/fr_FR'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { renderWindowContent } from '@windows/WindowContent'
import { electronApi } from '@api/electron'
import { appColors, appAntdTheme } from '@theme/windev-theme'

type DragCSS = CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }
type BtnType  = 'minimize' | 'maximize' | 'close'

const BTN_CFG: Record<BtnType, { sym: string; label: string; hoverBg: string }> = {
  minimize: { sym: '─', label: 'Réduire',  hoverBg: 'rgba(255,255,255,0.18)' },
  maximize: { sym: '□', label: 'Agrandir', hoverBg: 'rgba(255,255,255,0.18)' },
  close:    { sym: '✕', label: 'Fermer',   hoverBg: '#B82020'                },
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
        background: hov ? cfg.hoverBg : 'transparent',
        color: 'rgba(255,255,255,0.75)',
        fontSize: 11, cursor: 'pointer', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 3, transition: 'background 0.15s',
      }}
    >
      {cfg.sym}
    </button>
  )
}

export default function MdiWindowHost(): JSX.Element {
  const { id } = useParams<{ id: string }>()

  if (!id) {
    return <div style={{ padding: 20, color: '#DC2626' }}>Fenêtre introuvable</div>
  }

  const config = WINDOW_REGISTRY[id]
  const title  = config?.title ?? id

  return (
    <ConfigProvider locale={frFR} theme={appAntdTheme}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#FFFFFF' }}>

        {/* ── Title bar — même bleu que la sidebar MainScreen ────────── */}
        <div style={{
          height: 32, flexShrink: 0,
          background: `linear-gradient(180deg, #1E4B8F 0%, ${appColors.mdiTitleBg} 100%)`,
          borderBottom: '1px solid rgba(0,0,0,0.15)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
          display: 'flex', alignItems: 'center',
          padding: '0 2px 0 10px',
          userSelect: 'none',
          WebkitAppRegion: 'drag',
        } as DragCSS}>

          {/* Gold dot — cohérent avec accentGold du thème */}
          <div style={{
            width: 5, height: 5, borderRadius: '50%', flexShrink: 0,
            background: appColors.accentGold,
            boxShadow: `0 0 5px ${appColors.accentGold}`,
            marginRight: 8,
          }} />

          <span style={{
            color: 'rgba(255,255,255,0.92)', fontSize: 11, fontWeight: 600,
            letterSpacing: 0.3, flex: 1,
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
        <div style={{ flex: 1, overflow: 'auto', background: '#FFFFFF', padding: 8 }}>
          {renderWindowContent(id)}
        </div>
      </div>
    </ConfigProvider>
  )
}
