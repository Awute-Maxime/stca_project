import { useParams } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import frFR from 'antd/locale/fr_FR'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { renderWindowContent } from '@windows/WindowContent'
import { electronApi } from '@api/electron'
import { appColors } from '@theme/windev-theme'

type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }

export default function MdiWindowHost(): JSX.Element {
  const { id } = useParams<{ id: string }>()

  if (!id) return <div style={{ padding: 20, color: 'red' }}>Fenêtre introuvable</div>

  const config = WINDOW_REGISTRY[id]
  const title  = config?.title ?? id

  return (
    <ConfigProvider
      locale={frFR}
      theme={{ token: { colorPrimary: '#1B3A6B', colorLink: '#2563EB', borderRadius: 4 } }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

        {/* ── Barre de titre (le drag est géré par l'OS via WebkitAppRegion) ── */}
        <div style={{
          height: 30,
          flexShrink: 0,
          background: appColors.mdiTitleBg,
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px 0 12px',
          userSelect: 'none',
          WebkitAppRegion: 'drag',
        } as DragCSS}>
          <span style={{
            color: appColors.mdiTitleText,
            fontSize: 12,
            fontStyle: 'italic',
            fontWeight: 600,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {title}
          </span>

          {/* Boutons — no-drag pour qu'ils soient cliquables */}
          <div style={{ display: 'flex', gap: 2, WebkitAppRegion: 'no-drag' } as DragCSS}
               onMouseDown={e => e.stopPropagation()}>
            <TitleBtn symbol="–" label="Réduire"  onClick={() => electronApi.mdiSelfMinimize()} />
            <TitleBtn symbol="☐" label="Agrandir" onClick={() => electronApi.mdiSelfMaximize()} />
            <TitleBtn symbol="✕" label="Fermer"   onClick={() => electronApi.mdiSelfClose()} danger />
          </div>
        </div>

        {/* ── Contenu de la fenêtre ─────────────────────────────────────────── */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: appColors.mdiBodyBg,
          padding: 8,
        }}>
          {renderWindowContent(id)}
        </div>

      </div>
    </ConfigProvider>
  )
}

function TitleBtn({ symbol, label, onClick, danger }: {
  symbol: string
  label: string
  onClick: () => void
  danger?: boolean
}): JSX.Element {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        width: 26, height: 22,
        border: 'none',
        background: danger ? '#B82020' : 'rgba(255,255,255,0.15)',
        color: '#fff',
        fontSize: 12,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 2,
        transition: 'background 0.12s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.background =
          danger ? '#DC2626' : 'rgba(255,255,255,0.28)'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.background =
          danger ? '#B82020' : 'rgba(255,255,255,0.15)'
      }}
    >
      {symbol}
    </button>
  )
}
