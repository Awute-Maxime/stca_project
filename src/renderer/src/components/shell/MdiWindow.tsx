import { ReactNode, useState } from 'react'
import { useWindowStore } from '@store/windowStore'
import { appColors } from '@theme/windev-theme'

interface MdiWindowProps {
  id: string
  children: ReactNode
}

type SavedBounds = { x: number; y: number; w: number; h: number }

const MIN_W = 320
const MIN_H = 140

export default function MdiWindow({ id, children }: MdiWindowProps): JSX.Element | null {
  const win         = useWindowStore(s => s.windows[id])
  const focusWindow = useWindowStore(s => s.focusWindow)
  const closeWindow = useWindowStore(s => s.closeWindow)
  const minimize    = useWindowStore(s => s.minimizeWindow)
  const updatePos   = useWindowStore(s => s.updatePosition)
  const updateSize  = useWindowStore(s => s.updateSize)

  const [savedBounds, setSavedBounds] = useState<SavedBounds | null>(null)

  if (!win || !win.isOpen) return null

  const isMaximized = savedBounds !== null

  // ── Drag titre ──────────────────────────────────────────────────
  const handleTitleMouseDown = (e: React.MouseEvent): void => {
    if (isMaximized) return
    e.preventDefault()
    focusWindow(id)
    const startX = e.clientX - win.x
    const startY = e.clientY - win.y
    const onMove = (ev: MouseEvent): void => updatePos(id, ev.clientX - startX, ev.clientY - startY)
    const onUp   = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  // ── Redimensionnement coin SE ────────────────────────────────────
  const handleResizeMouseDown = (e: React.MouseEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const startY = e.clientY
    const startW = win.width
    const startH = win.height
    const onMove = (ev: MouseEvent): void =>
      updateSize(id,
        Math.max(MIN_W, startW + ev.clientX - startX),
        Math.max(MIN_H, startH + ev.clientY - startY)
      )
    const onUp = (): void => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup',   onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup',   onUp)
  }

  // ── Maximiser / restaurer ────────────────────────────────────────
  const handleMaximize = (): void => {
    if (isMaximized) {
      updatePos(id, savedBounds.x, savedBounds.y)
      updateSize(id, savedBounds.w, savedBounds.h)
      setSavedBounds(null)
    } else {
      setSavedBounds({ x: win.x, y: win.y, w: win.width, h: win.height })
      updatePos(id, 0, 0)
      updateSize(id, window.innerWidth, window.innerHeight)
    }
  }

  return (
    <div
      onMouseDown={() => focusWindow(id)}
      style={{
        position: 'fixed',
        left:   win.x,
        top:    win.y,
        width:  win.width,
        height: win.isMinimized ? 30 : win.height,
        zIndex: win.zIndex,
        display: 'flex',
        flexDirection: 'column',
        border: '1px solid rgba(27,58,107,0.7)',
        borderRadius: 4,
        boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
        overflow: 'hidden',
        transition: 'height 0.12s ease',
        minWidth: MIN_W,
      }}
    >
      {/* ── Barre de titre ─────────────────────────────────────── */}
      <div
        onMouseDown={handleTitleMouseDown}
        onDoubleClick={handleMaximize}
        style={{
          height: 30,
          flexShrink: 0,
          background: appColors.mdiTitleBg,
          display: 'flex',
          alignItems: 'center',
          padding: '0 4px 0 12px',
          cursor: isMaximized ? 'default' : 'grab',
          userSelect: 'none',
        }}
      >
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
          {win.title}
        </span>

        <div style={{ display: 'flex', gap: 2, flexShrink: 0 }} onMouseDown={e => e.stopPropagation()}>
          <TitleBtn label="Réduire"                     symbol="–"  onClick={() => minimize(id)} />
          <TitleBtn label={isMaximized ? 'Restaurer' : 'Agrandir'} symbol={isMaximized ? '❐' : '☐'} onClick={handleMaximize} />
          <TitleBtn label="Fermer"                      symbol="✕"  onClick={() => closeWindow(id)} danger />
        </div>
      </div>

      {/* ── Corps ──────────────────────────────────────────────── */}
      {!win.isMinimized && (
        <div style={{
          flex: 1,
          overflow: 'auto',
          background: appColors.mdiBodyBg,
          padding: 16,
          position: 'relative',
        }}>
          {children}
        </div>
      )}

      {/* ── Poignée de redimensionnement SE ────────────────────── */}
      {!win.isMinimized && !isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          title="Redimensionner"
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 18,
            height: 18,
            cursor: 'se-resize',
            zIndex: 1,
            background:
              'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.18) 50%)',
          }}
        />
      )}
    </div>
  )
}

function TitleBtn({ label, symbol, onClick, danger }: {
  label: string
  symbol: string
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
        transition: 'background 0.12s',
        borderRadius: 2,
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
