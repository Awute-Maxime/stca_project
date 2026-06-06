import { ReactNode, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MinusOutlined, BorderOutlined, CloseOutlined, FullscreenExitOutlined } from '@ant-design/icons'
import { useWindowStore, WindowId, WINDOW_CONFIG } from '@store/windowStore'

interface FloatingWindowProps {
  id: WindowId
  children: ReactNode
}

export default function FloatingWindow({ id, children }: FloatingWindowProps): JSX.Element {
  const win         = useWindowStore(s => s.windows[id])
  const focusWindow = useWindowStore(s => s.focusWindow)
  const closeWindow = useWindowStore(s => s.closeWindow)
  const minimize    = useWindowStore(s => s.minimizeWindow)
  const updatePos   = useWindowStore(s => s.updatePosition)
  const config      = WINDOW_CONFIG[id]

  const [isMaximized, setIsMaximized] = useState(false)

  const handleTitleMouseDown = (e: React.MouseEvent): void => {
    if (isMaximized) return
    e.preventDefault()
    focusWindow(id)

    const startX    = e.clientX
    const startY    = e.clientY
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
    <motion.div
      key={id}
      initial={{ opacity: 0, scale: 0.94 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.1 } }}
      transition={{ duration: 0.18 }}
      onMouseDown={() => focusWindow(id)}
      style={{
        position:      'absolute',
        left:          isMaximized ? 0 : win.x,
        top:           isMaximized ? 0 : win.y,
        width:         isMaximized ? '100%' : config.width,
        height:        isMaximized ? '100%' : win.isMinimized ? 32 : config.height,
        zIndex:        win.zIndex,
        display:       'flex',
        flexDirection: 'column',
        borderRadius:  isMaximized ? 0 : 3,
        overflow:      'hidden',
        boxShadow:     '0 6px 28px rgba(0,0,0,0.30), 0 1px 4px rgba(0,0,0,0.15)',
        border:        '1px solid rgba(0,0,0,0.25)',
        transition:    'height 0.18s ease, border-radius 0.18s',
      }}
    >
      {/* ── Barre de titre (olive → vert forêt, comme l'original) ── */}
      <div
        onMouseDown={handleTitleMouseDown}
        style={{
          background:  'linear-gradient(90deg, #5A7840 0%, #3D5C28 45%, #2A4018 100%)',
          height:      32,
          flexShrink:  0,
          display:     'flex',
          alignItems:  'center',
          padding:     '0 4px 0 10px',
          cursor:      isMaximized ? 'default' : 'grab',
          userSelect:  'none',
          borderBottom:'1px solid rgba(0,0,0,0.2)',
        }}
      >
        {/* Titre en italique comme l'original */}
        <span style={{
          color:          'rgba(255,255,255,0.92)',
          fontSize:       12,
          fontWeight:     600,
          fontStyle:      'italic',
          flex:           1,
          overflow:       'hidden',
          textOverflow:   'ellipsis',
          whiteSpace:     'nowrap',
          textShadow:     '0 1px 2px rgba(0,0,0,0.4)',
          letterSpacing:  0.3,
        }}>
          {win.title}
        </span>

        {/* Boutons de contrôle */}
        <div style={{ display: 'flex', gap: 1, marginLeft: 6 }} onMouseDown={e => e.stopPropagation()}>
          <WinBtn
            onClick={() => minimize(id)}
            bg={win.isMinimized ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)'}
            hoverBg="rgba(255,255,255,0.25)"
            title={win.isMinimized ? 'Restaurer' : 'Réduire'}
          >
            <MinusOutlined style={{ fontSize: 10 }} />
          </WinBtn>
          <WinBtn
            onClick={() => setIsMaximized(m => !m)}
            bg={isMaximized ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.12)'}
            hoverBg="rgba(255,255,255,0.25)"
            title={isMaximized ? 'Restaurer' : 'Agrandir'}
          >
            {isMaximized ? <FullscreenExitOutlined style={{ fontSize: 10 }} /> : <BorderOutlined style={{ fontSize: 10 }} />}
          </WinBtn>
          <WinBtn
            onClick={() => closeWindow(id)}
            bg="#B82020"
            hoverBg="#D21034"
            title="Fermer"
          >
            <CloseOutlined style={{ fontSize: 10 }} />
          </WinBtn>
        </div>
      </div>

      {/* ── Contenu ──────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {!win.isMinimized && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{ flex: 1, overflow: 'auto', background: '#F4F4F0', padding: 16 }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

/* Bouton générique de la title bar */
function WinBtn({ children, onClick, bg, hoverBg, title }: {
  children: ReactNode
  onClick: () => void
  bg: string
  hoverBg: string
  title?: string
}): JSX.Element {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: 24, height: 22,
        border: 'none',
        borderRadius: 2,
        background: hovered ? hoverBg : bg,
        color: '#fff',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'background 0.12s',
      }}
    >
      {children}
    </button>
  )
}
