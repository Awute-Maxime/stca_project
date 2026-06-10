import { ReactNode, useState } from 'react'
import { useWindowStore } from '@store/windowStore'
import { appColors } from '@theme/windev-theme'

interface MdiWindowProps {
  id: string
  children: ReactNode
}

export default function MdiWindow({ id, children }: MdiWindowProps): JSX.Element | null {
  const win         = useWindowStore(s => s.windows[id])
  const focusWindow = useWindowStore(s => s.focusWindow)
  const closeWindow = useWindowStore(s => s.closeWindow)
  const minimize    = useWindowStore(s => s.minimizeWindow)
  const updatePos   = useWindowStore(s => s.updatePosition)

  const [isMaximized, setIsMaximized] = useState(false)

  if (!win || !win.isOpen) return null

  const handleTitleMouseDown = (e: React.MouseEvent): void => {
    if (isMaximized) return
    e.preventDefault()
    focusWindow(id)

    const startX = e.clientX
    const startY = e.clientY
    const startWinX = win.x
    const startWinY = win.y

    const onMove = (ev: MouseEvent): void =>
      updatePos(id, Math.max(0, startWinX + ev.clientX - startX), Math.max(0, startWinY + ev.clientY - startY))
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div
      onMouseDown={() => focusWindow(id)}
      style={{
        position: 'absolute',
        left:   isMaximized ? 0 : win.x,
        top:    isMaximized ? 0 : win.y,
        width:  isMaximized ? '100%' : win.width,
        height: isMaximized ? '100%' : win.isMinimized ? 30 : win.height,
        zIndex: win.zIndex,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid #1B3A6B',
        boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        overflow: 'hidden'
      }}
    >
      {/* Barre de titre — fond bleu marine */}
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          height: 30,
          flexShrink: 0,
          background: appColors.mdiTitleBg,
          display: 'flex',
          alignItems: 'center',
          padding: '0 6px 0 12px',
          cursor: isMaximized ? 'default' : 'grab',
          userSelect: 'none'
        }}
      >
        <span style={{
          color: appColors.mdiTitleText,
          fontSize: 13,
          fontStyle: 'italic',
          fontWeight: 600,
          flex: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {win.title}
        </span>

        <div style={{ display: 'flex', gap: 2 }} onMouseDown={e => e.stopPropagation()}>
          <TitleBarButton label="Réduire" onClick={() => minimize(id)} symbol="–" />
          <TitleBarButton
            label={isMaximized ? 'Restaurer' : 'Agrandir'}
            onClick={() => setIsMaximized(m => !m)}
            symbol={isMaximized ? '❐' : '☐'}
          />
          <TitleBarButton label="Fermer" onClick={() => closeWindow(id)} symbol="✕" danger />
        </div>
      </div>

      {/* Corps */}
      {!win.isMinimized && (
        <div style={{ flex: 1, overflow: 'auto', background: appColors.mdiBodyBg, padding: 16 }}>
          {children}
        </div>
      )}
    </div>
  )
}

function TitleBarButton({ label, onClick, symbol, danger }: {
  label: string
  onClick: () => void
  symbol: string
  danger?: boolean
}): JSX.Element {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      style={{
        width: 26,
        height: 22,
        border: 'none',
        background: danger ? '#B82020' : 'rgba(255,255,255,0.15)',
        color: '#fff',
        fontSize: 11,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}
    >
      {symbol}
    </button>
  )
}
