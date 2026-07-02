import { useState, useRef, useCallback } from 'react'
import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// DraggableWindow — fenêtre overlay déplaçable / redimensionnable (Règle 17)
//
// Fournit : barre de titre navy (drag + double-clic = maximiser), boutons
// − / □ / ✕ fonctionnels, poignée de redimensionnement en bas à droite,
// réduction en pastille cliquable, centrage initial, fond assombri
// (clic dessus = fermer).
//
// Utilisé par tous les aperçus (Liste, Destination, Carte Grise, Analyse…)
// et réutilisable pour toute future fenêtre overlay.
// ─────────────────────────────────────────────────────────────────────────────

interface DraggableWindowProps {
  title: string
  icon?: string
  width?: number          // largeur initiale (px)
  height?: number         // hauteur initiale (px) — défaut : 88% de l'écran
  minWidth?: number
  minHeight?: number
  zIndex?: number
  onClose: () => void
  children: ReactNode     // contenu sous la barre de titre (colonne flex)
}

export default function DraggableWindow({
  title, icon = '🖨', width = 900, height,
  minWidth = 480, minHeight = 320, zIndex = 800,
  onClose, children,
}: DraggableWindowProps): JSX.Element {
  const initH = height ?? Math.round(window.innerHeight * 0.88)

  const [winPos, setWinPos] = useState(() => ({
    x: Math.max(0, Math.round((window.innerWidth - width) / 2)),
    y: Math.max(0, Math.round((window.innerHeight - initH) / 2)),
  }))
  const [winSize, setWinSize] = useState({ w: width, h: initH })
  const [maximized, setMaximized] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const preMaxRef = useRef({ x: 0, y: 0, w: width, h: initH })
  const dragRef = useRef({ dragging: false, ox: 0, oy: 0 })
  const resizeRef = useRef({ resizing: false, ox: 0, oy: 0, ow: 0, oh: 0 })

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (maximized) return
    dragRef.current = { dragging: true, ox: e.clientX - winPos.x, oy: e.clientY - winPos.y }
    const onMove = (ev: MouseEvent): void => {
      if (!dragRef.current.dragging) return
      setWinPos({ x: ev.clientX - dragRef.current.ox, y: Math.max(0, ev.clientY - dragRef.current.oy) })
    }
    const onUp = (): void => {
      dragRef.current.dragging = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [winPos, maximized])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (maximized) return
    resizeRef.current = { resizing: true, ox: e.clientX, oy: e.clientY, ow: winSize.w, oh: winSize.h }
    const onMove = (ev: MouseEvent): void => {
      if (!resizeRef.current.resizing) return
      setWinSize({
        w: Math.max(minWidth, resizeRef.current.ow + ev.clientX - resizeRef.current.ox),
        h: Math.max(minHeight, resizeRef.current.oh + ev.clientY - resizeRef.current.oy),
      })
    }
    const onUp = (): void => {
      resizeRef.current.resizing = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [winSize, maximized, minWidth, minHeight])

  const toggleMaximize = (): void => {
    if (maximized) {
      setWinPos({ x: preMaxRef.current.x, y: preMaxRef.current.y })
      setWinSize({ w: preMaxRef.current.w, h: preMaxRef.current.h })
      setMaximized(false)
    } else {
      preMaxRef.current = { x: winPos.x, y: winPos.y, w: winSize.w, h: winSize.h }
      setWinPos({ x: 0, y: 0 })
      setWinSize({ w: window.innerWidth, h: window.innerHeight })
      setMaximized(true)
    }
  }

  // ── Réduit : pastille cliquable en bas de l'écran ─────────────────────────
  if (minimized) {
    return (
      <div
        onClick={() => setMinimized(false)}
        style={{
          position: 'fixed', bottom: 40, left: Math.max(8, winPos.x), zIndex,
          background: '#1B3A6B', borderRadius: 6, padding: '6px 14px',
          display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
        }}
      >
        <span style={{ fontSize: 11 }}>{icon}</span>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>{title}</span>
      </div>
    )
  }

  const titleBtn: React.CSSProperties = {
    width: 28, height: 22, border: 'none', background: 'none',
    color: 'rgba(255,255,255,0.65)', cursor: 'pointer',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 3, transition: 'background 0.15s',
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex, pointerEvents: 'none' }}>
      {/* Fond assombri — clic = fermer */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'auto' }}
      />

      {/* Fenêtre */}
      <div style={{
        position: 'absolute',
        left: winPos.x, top: winPos.y,
        width: maximized ? '100%' : winSize.w,
        height: maximized ? '100%' : winSize.h,
        display: 'flex', flexDirection: 'column',
        background: '#fff',
        borderRadius: maximized ? 0 : 6,
        overflow: 'hidden',
        boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
        border: maximized ? 'none' : '1px solid rgba(0,0,0,0.12)',
        pointerEvents: 'auto',
      }}>

        {/* Barre de titre — drag + double-clic maximiser */}
        <div
          onMouseDown={handleDragStart}
          onDoubleClick={toggleMaximize}
          style={{
            height: 32, background: '#1B3A6B',
            display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0,
            cursor: maximized ? 'default' : 'move', userSelect: 'none',
          }}
        >
          <span style={{ fontSize: 11, marginRight: 6 }}>{icon}</span>
          <span style={{
            flex: 1, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
            letterSpacing: 0.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{title}</span>

          <div style={{ display: 'flex', gap: 1 }} onMouseDown={e => e.stopPropagation()}>
            <button onClick={() => setMinimized(true)} title="Réduire" style={{ ...titleBtn, fontSize: 13 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >−</button>
            <button onClick={toggleMaximize} title="Agrandir" style={{ ...titleBtn, fontSize: 11 }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
            >□</button>
            <button onClick={onClose} title="Fermer" style={{ ...titleBtn, fontSize: 13 }}
              onMouseEnter={e => { e.currentTarget.style.background = '#E81123'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
            >✕</button>
          </div>
        </div>

        {/* Contenu */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
          {children}
        </div>

        {/* Poignée de redimensionnement */}
        {!maximized && (
          <div onMouseDown={handleResizeStart} style={{
            position: 'absolute', bottom: 0, right: 0, width: 16, height: 16,
            cursor: 'nwse-resize', zIndex: 10,
            background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%)',
          }} />
        )}
      </div>
    </div>
  )
}
