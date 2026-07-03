import { useState, useMemo, useRef, useCallback } from 'react'
import { notification } from 'antd'
import dayjs from 'dayjs'
import { useVehicules } from '@mock/vehiculesStore'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'

const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}

const thStyle: React.CSSProperties = {
  fontSize: 9, fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
  letterSpacing: 0.4, padding: 8, borderBottom: '2px solid #E2E8F0',
  textAlign: 'left', whiteSpace: 'nowrap', background: '#F8FAFF',
}
const tdStyle: React.CSSProperties = {
  padding: 8, color: '#1E293B', borderBottom: '1px solid #F1F5F9',
}

export function AnalyseAssuranceWindow(): JSX.Element {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#94A3B8', fontSize: 13 }}>
      Gain généré par les assurances — accessible via le bouton Analyse → ASSURANCE
    </div>
  )
}

export function MontantRestituerWindow({ onClose }: { onClose?: () => void }): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto
  const closeWindow = (): void => {
    if (onClose) onClose()
    else window.dispatchEvent(new CustomEvent('mdi:close-self'))
  }
  const todayISO = dayjs().format('YYYY-MM-DD')
  const [authed, setAuthed] = useState(false)
  const [password, setPassword] = useState('')
  // Dates du jour par défaut — la recherche ne se lance qu'au CLIC sur
  // Rechercher (appliedFrom/To), comme le vrai STCA (pas d'autochargement)
  const [from, setFrom] = useState(todayISO)
  const [to, setTo] = useState(todayISO)
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [active, setActive] = useState(false)
  const [assurFilter, setAssurFilter] = useState('')
  const [printDialog, setPrintDialog] = useState(false)

  const doSearch = (): void => {
    setAppliedFrom(from)
    setAppliedTo(to)
    setActive(true)
  }

  // Aperçu (Minimum/Détaillé) dans sa propre BrowserWindow — Règle 10
  const openApercu = (mode: 'minimum' | 'detail'): void => {
    localStorage.setItem('tcit_apercu_montantRestituer', JSON.stringify({ from: appliedFrom, to: appliedTo, mode, ts: Date.now() }))
    const cfg = WINDOW_REGISTRY['apercu.montantRestituer']
    if (cfg) electronApi.mdiOpen({ id: 'apercu.montantRestituer', x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
  }

  // ── Window drag + resize + maximize state ────────────────────────────────
  const [winPos, setWinPos] = useState({ x: -1, y: -1 })
  const [winSize, setWinSize] = useState({ w: 1100, h: Math.round(window.innerHeight * 0.88) })
  const [maximized, setMaximized] = useState(false)
  const [minimized, setMinimized] = useState(false)
  const preMaxRef = useRef({ x: 0, y: 0, w: 1100, h: 0 })
  const dragRef = useRef<{ dragging: boolean; ox: number; oy: number }>({ dragging: false, ox: 0, oy: 0 })
  const resizeRef = useRef<{ resizing: boolean; ox: number; oy: number; ow: number; oh: number }>({ resizing: false, ox: 0, oy: 0, ow: 0, oh: 0 })

  // Center on first render
  if (winPos.x < 0) {
    const cx = Math.max(0, Math.round((window.innerWidth - winSize.w) / 2))
    const cy = Math.max(0, Math.round((window.innerHeight - winSize.h) / 2))
    setWinPos({ x: cx, y: cy })
  }

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (maximized) return
    dragRef.current = { dragging: true, ox: e.clientX - winPos.x, oy: e.clientY - winPos.y }
    const onMove = (ev: MouseEvent): void => {
      if (!dragRef.current.dragging) return
      setWinPos({ x: ev.clientX - dragRef.current.ox, y: Math.max(0, ev.clientY - dragRef.current.oy) })
    }
    const onUp = (): void => { dragRef.current.dragging = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [winPos, maximized])

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    if (maximized) return
    resizeRef.current = { resizing: true, ox: e.clientX, oy: e.clientY, ow: winSize.w, oh: winSize.h }
    const onMove = (ev: MouseEvent): void => {
      if (!resizeRef.current.resizing) return
      const nw = Math.max(700, resizeRef.current.ow + ev.clientX - resizeRef.current.ox)
      const nh = Math.max(400, resizeRef.current.oh + ev.clientY - resizeRef.current.oy)
      setWinSize({ w: nw, h: nh })
    }
    const onUp = (): void => { resizeRef.current.resizing = false; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [winSize, maximized])

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

  const filtered = useMemo(() => {
    if (!active) return []
    return vehicules.filter(v => {
      const d = v.date.slice(0, 10) // date seule (les mocks contiennent HH:mm)
      return d >= appliedFrom && d <= appliedTo
    })
  }, [vehicules, active, appliedFrom, appliedTo])

  const totalRestituer = filtered.reduce((s, v) => s + Math.round(v.montant * 0.78), 0)
  const sorties = filtered.filter(v => v.recyclerPlaque).length

  const handlePwdOk = (): void => {
    if (!password.trim()) {
      notification.warning({ message: '⚠️ Veuillez saisir le mot de passe admin.', placement: 'bottomRight' })
      return
    }
    setAuthed(true)
  }

  const OV: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }

  // ── Modal mot de passe (avant accès) ────────────────────────────────────
  if (!authed) {
    return (
      <div style={OV}>
        <div style={{
          background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: 450, padding: 0,
        }}>
          {/* Titlebar */}
          <div style={{
            display: 'flex', alignItems: 'center', padding: '14px 20px',
            borderBottom: '1px solid #E2E8F0', background: '#1B3A6B', borderRadius: '10px 10px 0 0',
          }}>
            <span style={{ fontSize: 12, marginRight: 8 }}>🔒</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Saisie du mot de passe de Configuration</span>
            <button onClick={() => closeWindow()} style={{
              width: 26, height: 26, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
              cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4,
            }}>✕</button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{
              border: '1px solid #E2E8F0', background: '#F8FAFF',
              borderRadius: 6, padding: '14px 16px', marginBottom: 16,
            }}>
              <p style={{ color: '#DC2626', fontSize: 11.5, margin: '0 0 14px', lineHeight: 1.5 }}>
                Donnez le mot de passe de forçage pour accéder aux fonctions d&apos;Administrateur de TCIT.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11.5, whiteSpace: 'nowrap', color: '#374151' }}>» Mot de passe Admin. :</label>
                <input type="password" className="light-input" value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handlePwdOk() }}
                  autoFocus
                  style={{ width: 110, padding: '4px 8px', fontSize: 13, height: 26 }} />
                <button onClick={handlePwdOk} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '5px 16px', background: '#2563EB', color: '#fff',
                  border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}>OK ✔</button>
              </div>
            </div>
            <div style={{ textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>⚠️</span>
                <span style={{ fontSize: 11.5, color: '#92400E' }}>Ou déverrouiller par la clé USB :</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
                  background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
                  borderRadius: 5, fontSize: 12, cursor: 'pointer',
                }}>⚡ Lire Clé USB</button>
                <button onClick={() => closeWindow()} style={{
                  height: 34, padding: '0 16px', background: '#fff', color: '#374151',
                  border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
                }}>Annuler</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── En-tête tableau — style STCA II (fond rosé/saumon) ───────────────────
  const mrTh: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#1E293B',
    padding: '6px 8px', borderBottom: '2px solid #E8A0A0',
    textAlign: 'left', whiteSpace: 'nowrap',
    background: '#F5E0E0',
  }

  if (minimized) {
    return (
      <div style={{
        position: 'fixed', bottom: 40, left: winPos.x, zIndex: 800,
        background: '#1B3A6B', borderRadius: 6, padding: '6px 14px',
        display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
        boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
      }} onClick={() => setMinimized(false)}>
        <span style={{ fontSize: 11 }}>💰</span>
        <span style={{ fontSize: 11, color: '#fff', fontWeight: 600 }}>Montant à restituer</span>
      </div>
    )
  }

  // ── Fenêtre principale (après mot de passe) ─────────────────────────────
  return (
    <>
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      pointerEvents: 'none',
    }}>
    {/* Fond sombre cliquable pour fermer */}
    <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', pointerEvents: 'auto' }} onClick={closeWindow} />

    <div style={{
      position: 'absolute',
      left: winPos.x, top: winPos.y,
      width: maximized ? '100%' : winSize.w, height: maximized ? '100%' : winSize.h,
      display: 'flex', flexDirection: 'column',
      background: '#fff', borderRadius: maximized ? 0 : 6, overflow: 'hidden',
      boxShadow: '0 20px 60px rgba(0,0,0,0.25), 0 4px 12px rgba(0,0,0,0.15)',
      border: maximized ? 'none' : '1px solid rgba(0,0,0,0.12)',
      pointerEvents: 'auto',
    }}>

      {/* ── Title bar — draggable ───────────────────────────────────── */}
      <div
        onMouseDown={handleDragStart}
        onDoubleClick={toggleMaximize}
        style={{
          height: 32, background: '#1B3A6B',
          display: 'flex', alignItems: 'center', padding: '0 10px', flexShrink: 0,
          cursor: maximized ? 'default' : 'move', userSelect: 'none',
        }}
      >
        <span style={{ fontSize: 11, marginRight: 6 }}>💰</span>
        <span style={{
          flex: 1, fontSize: 11.5, fontWeight: 700, color: 'rgba(255,255,255,0.9)',
          letterSpacing: 0.4,
        }}>Montant à restituer</span>
        <div style={{ display: 'flex', gap: 1 }} onMouseDown={e => e.stopPropagation()}>
          <button onClick={() => setMinimized(true)} style={{
            width: 28, height: 22, border: 'none', background: 'none',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >−</button>
          <button onClick={toggleMaximize} style={{
            width: 28, height: 22, border: 'none', background: 'none',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 11,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >□</button>
          <button onClick={closeWindow} style={{
            width: 28, height: 22, border: 'none', background: 'none',
            color: 'rgba(255,255,255,0.65)', cursor: 'pointer', fontSize: 13,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 3,
            transition: 'background 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#E81123'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'rgba(255,255,255,0.65)' }}
          >✕</button>
        </div>
      </div>

      {/* ── Sous-titre vert ────────────────────────────────────────── */}
      <div style={{
        padding: '4px 14px', fontSize: 11.5, fontWeight: 600, color: '#16A34A',
        borderBottom: '1px solid #E2E8F0', flexShrink: 0, fontStyle: 'italic',
      }}>Montant à restituer</div>

      {/* ── Toolbar — bien espacée sur toute la largeur ────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px',
        background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
      }}>
        <input type="date" className="light-input" value={from} onChange={e => setFrom(e.target.value)}
          style={{ padding: '4px 6px', fontSize: 12, width: 132, height: 28 }} />
        <input type="date" className="light-input" value={to} onChange={e => setTo(e.target.value)}
          style={{ padding: '4px 6px', fontSize: 12, width: 132, height: 28 }} />
        <button onClick={doSearch} style={{
          padding: '6px 18px', background: '#2563EB', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>🔍 Rechercher</button>
        <button onClick={() => {
          if (!active || filtered.length === 0) {
            notification.warning({ message: 'Aucune donnée à imprimer.', description: 'Sélectionnez une période puis cliquez sur Rechercher.', placement: 'bottomRight' })
            return
          }
          setPrintDialog(true)
        }} style={{
          padding: '6px 18px', background: '#EFF6FF', color: '#1D4ED8',
          border: '1px solid #BFDBFE', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>🖨 Imprimer</button>
        <button onClick={closeWindow} style={{
          padding: '6px 14px', background: '#FFF5F5', color: '#DC2626',
          border: '1px solid #FECACA', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>✕ Quitter</button>

        <div style={{ flex: 1 }} />

        <label style={{ fontSize: 12, color: '#374151', fontWeight: 600, whiteSpace: 'nowrap' }}>Assurance</label>
        <select className="light-input" value={assurFilter} onChange={e => setAssurFilter(e.target.value)}
          style={{ fontSize: 12, padding: '4px 8px', width: 220, height: 28 }}>
          <option value="">POOL TPV VT - MOTO</option>
        </select>
      </div>

      {/* Table — colonnes conformes au vrai STCA II, en-tête rosé */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <table style={{ width: '100%', minWidth: 1100, borderCollapse: 'collapse', fontSize: 11 }}>
          <thead>
            <tr>
              <th style={mrTh}>Réf</th>
              <th style={mrTh}>Nom et prénom</th>
              <th style={mrTh}>Adresse</th>
              <th style={mrTh}>Type</th>
              <th style={mrTh}>Marque et modèle</th>
              <th style={mrTh}>N° Chassis</th>
              <th style={mrTh}>Immatriculation</th>
              <th style={mrTh}>Destination</th>
              <th style={mrTh}>N° de Tri</th>
              <th style={mrTh}>Enregistré le</th>
              <th style={{ ...mrTh, textAlign: 'right' }}>Montant à restituer</th>
              <th style={mrTh}>Sortie</th>
              <th style={mrTh}>Sortie le</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={13} style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontStyle: 'italic' }}>
                {active ? 'Aucun enregistrement pour cette période' : 'Sélectionnez une période puis cliquez sur Rechercher'}
              </td></tr>
            ) : filtered.map(v => {
              const bg = DEST_COLORS[v.destination] ?? '#6B7280'
              return (
                <tr key={v.id}>
                  <td style={{ ...tdStyle, color: v.recyclerPlaque ? undefined : '#64748B', background: v.recyclerPlaque ? '#D1FAE5' : undefined }}>{v.ref}</td>
                  <td style={{ ...tdStyle, fontWeight: 500, textTransform: 'uppercase' }}>{v.nomAcheteur}</td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{v.paysResidence}/{v.paysDestination || v.paysResidence}</td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{v.typeVehicule}</td>
                  <td style={{ ...tdStyle, textTransform: 'uppercase' }}>{v.marqueModele}</td>
                  <td style={{ ...tdStyle, fontFamily: "'Courier New', monospace", fontSize: 10, color: '#2563EB' }}>{v.chassis}</td>
                  <td style={tdStyle}>
                    <span style={{
                      fontFamily: "'Courier New', monospace", fontWeight: 700, color: '#D97706', fontSize: 10.5,
                      background: '#FFF7ED', border: '1px solid #FED7AA', padding: '2px 6px', borderRadius: 3,
                    }}>{v.immat}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 3, color: destTxt(bg), background: bg }}>{v.destination}</span>
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center', color: '#7C3AED', fontWeight: 600 }}>
                    {String(10000 + v.id).padStart(6, '0')}
                  </td>
                  <td style={{ ...tdStyle, color: '#475569' }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                  <td style={{ ...tdStyle, textAlign: 'right', color: '#DC2626', fontWeight: 700 }}>
                    {Math.round(v.montant * 0.78).toLocaleString('fr-FR')}
                  </td>
                  <td style={{ ...tdStyle, textAlign: 'center' }}>
                    {v.recyclerPlaque ? <span style={{ color: '#16A34A', fontWeight: 700 }}>✓</span> : <span style={{ color: '#CBD5E1' }}>—</span>}
                  </td>
                  <td style={{ ...tdStyle, color: '#475569' }}>
                    {v.recyclerPlaque ? dayjs(v.date).add(1, 'day').format('DD/MM/YYYY') : ''}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Barre statut — comme STCA II */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '6px 12px', borderTop: '2px solid #E2E8F0', flexShrink: 0, fontSize: 12,
      }}>
        <span style={{ color: '#DC2626', fontWeight: 600 }}>
          Nbr de Véhicule(s) : {filtered.length} &nbsp;·&nbsp; Nbr de Véhicule(s) Sortie(s) : {sorties}
        </span>
        <span style={{ fontWeight: 700, color: '#1E293B' }}>
          Montant Total à restituer &nbsp;
          <span style={{
            color: '#DC2626', fontSize: 15, fontWeight: 800,
            background: '#FEF2F2', padding: '2px 10px', borderRadius: 4, border: '1px solid #FECACA',
          }}>{totalRestituer.toLocaleString('fr-FR')}</span>
        </span>
      </div>

      {/* ── Resize handle ─────────────────────────────────────────── */}
      {!maximized && (
        <div onMouseDown={handleResizeStart} style={{
          position: 'absolute', bottom: 0, right: 0, width: 16, height: 16,
          cursor: 'nwse-resize', zIndex: 10,
          background: 'linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.15) 50%)',
        }} />
      )}
    </div>{/* fin fenêtre absolute */}
    </div>{/* fin overlay */}

    {/* Dialog choix mode impression — Minimum / Détaillé / Annuler */}
    {printDialog && (
      <div style={{
        position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 900,
      }}>
        <div style={{
          background: '#fff', border: '1px solid #CBD5E1', borderRadius: 8,
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)', padding: 0, minWidth: 340,
        }}>
          <div style={{
            padding: '8px 14px', borderBottom: '1px solid #E2E8F0',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>Montant à restituer</span>
            <button onClick={() => setPrintDialog(false)} style={{
              background: 'none', border: 'none', fontSize: 15, color: '#94A3B8', cursor: 'pointer',
            }}>✕</button>
          </div>
          <div style={{ padding: '20px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
              <span style={{ fontSize: 28 }}>❓</span>
              <span style={{ fontSize: 12.5, color: '#1E293B' }}>Imprimer le document en mode</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
              <button onClick={() => { setPrintDialog(false); openApercu('minimum') }} style={{
                padding: '6px 20px', background: '#fff', color: '#1E293B',
                border: '2px solid #1E293B', borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>Minimum</button>
              <button onClick={() => { setPrintDialog(false); openApercu('detail') }} style={{
                padding: '6px 20px', background: '#fff', color: '#1E293B',
                border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              }}>Détaillé</button>
              <button onClick={() => setPrintDialog(false)} style={{
                padding: '6px 20px', background: '#fff', color: '#1E293B',
                border: '1px solid #CBD5E1', borderRadius: 4, fontSize: 12, cursor: 'pointer',
              }}>Annuler</button>
            </div>
          </div>
        </div>
      </div>
    )}


    </>
  )
}
