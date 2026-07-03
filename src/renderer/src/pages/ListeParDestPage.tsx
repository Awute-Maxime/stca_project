import { useState, useMemo } from 'react'
import dayjs from 'dayjs'
import { useVehicules } from '@mock/vehiculesStore'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { WinAlert } from '@components/WinDialogs'
import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Liste des véhicules enregistrés par destination — conforme au VRAI STCA II
// (fenêtre « Nombre Véhicules par Frontières ») : comptage par frontière ET
// par jour — colonnes Frontières | Nombre | Enregistré le.
// Style visuel : prototype (toolbar .fi/.be, en-têtes buildDest, barre jaune).
// Impression → aperçu dans sa propre BrowserWindow (apercu.listeParDest).
// ─────────────────────────────────────────────────────────────────────────────

export default function ListeParDestPage(): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto
  const todayISO = dayjs().format('YYYY-MM-DD')
  const d30 = dayjs().subtract(30, 'day').format('YYYY-MM-DD')

  // Dates saisies vs appliquées (recherche au CLIC uniquement — comme le vrai STCA)
  const [from, setFrom] = useState(d30)
  const [to, setTo] = useState(todayISO)
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [active, setActive] = useState(false)
  const [alert, setAlert] = useState<ReactNode | null>(null)

  const doSearch = (): void => {
    setAppliedFrom(from)
    setAppliedTo(to)
    setActive(true)
  }

  // Comptage par (frontière, jour) — trié par frontière puis date croissante
  const rows = useMemo(() => {
    if (!active) return []
    const counts = new Map<string, { code: string; date: string; n: number }>()
    for (const v of vehicules) {
      const d = v.date.slice(0, 10)
      if (d < appliedFrom || d > appliedTo) continue
      const key = `${v.destination}|${d}`
      const entry = counts.get(key)
      if (entry) entry.n++
      else counts.set(key, { code: v.destination, date: d, n: 1 })
    }
    return Array.from(counts.values()).sort((a, b) =>
      a.code === b.code ? a.date.localeCompare(b.date) : a.code.localeCompare(b.code)
    )
  }, [vehicules, active, appliedFrom, appliedTo])

  const totalVehicules = rows.reduce((s, r) => s + r.n, 0)
  const nbFrontieres = new Set(rows.map(r => r.code)).size

  const openApercu = (): void => {
    if (rows.length === 0) {
      setAlert(<>Aucune donnée à imprimer.<br />Sélectionnez une période et cliquez sur <strong>Rechercher</strong>.</>)
      return
    }
    localStorage.setItem('tcit_apercu_listeParDest', JSON.stringify({ from: appliedFrom, to: appliedTo }))
    const cfg = WINDOW_REGISTRY['apercu.listeParDest']
    if (cfg) electronApi.mdiOpen({ id: 'apercu.listeParDest', x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
  }

  // En-têtes — style prototype buildDest
  const thStyle: React.CSSProperties = {
    textAlign: 'center', padding: '8px 14px',
    fontSize: 11.5, color: '#475569', fontWeight: 700,
    borderBottom: '2px solid #CBD5E1', letterSpacing: 0.4,
    background: '#EEF2F9',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff', overflow: 'hidden' }}>

      {/* ── Toolbar — dates + Rechercher + Imprimer (comme le vrai STCA) ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderBottom: '2px solid #CBD5E1',
        background: '#F0F4FF', flexShrink: 0, flexWrap: 'wrap',
      }}>
        <label style={{ fontSize: 11.5, color: '#374151', whiteSpace: 'nowrap' }}>Du :</label>
        <input type="date" className="light-input" value={from}
          onChange={e => setFrom(e.target.value)}
          style={{ padding: '3px 5px', fontSize: 11, width: 126, height: 26 }} />
        <label style={{ fontSize: 11.5, color: '#374151', whiteSpace: 'nowrap' }}>au :</label>
        <input type="date" className="light-input" value={to}
          onChange={e => setTo(e.target.value)}
          style={{ padding: '3px 5px', fontSize: 11, width: 126, height: 26 }} />
        <button onClick={doSearch} style={{
          height: 32, padding: '0 14px', background: '#2563EB', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>🔍 Rechercher</button>
        <button onClick={openApercu} title="Imprimer" style={{
          height: 32, padding: '0 14px', background: '#EFF6FF', color: '#1D4ED8',
          border: '1px solid #BFDBFE', borderRadius: 5, fontSize: 11.5, fontWeight: 700, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 5,
        }}>🖨 Imprimer</button>
      </div>

      {/* ── Table Frontières | Nombre | Enregistré le ─────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!active ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>
            Cliquez sur Rechercher pour afficher la liste
          </div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>
            Aucun véhicule pour cette période
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>Frontières</th>
                <th style={thStyle}>Nombre</th>
                <th style={thStyle}>Enregistré le</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={`${r.code}-${r.date}`} style={{
                  borderBottom: '1px solid #F1F5F9',
                  background: i % 2 === 0 ? '#fff' : '#F8FAFF',
                }}>
                  <td style={{ textAlign: 'center', padding: '7px 14px', color: '#2563EB', fontWeight: 700 }}>{r.code}</td>
                  <td style={{ textAlign: 'center', padding: '7px 14px', color: '#DC2626', fontWeight: 700 }}>{r.n}</td>
                  <td style={{ textAlign: 'center', padding: '7px 14px', color: '#475569' }}>{dayjs(r.date).format('DD/MM/YYYY')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Barre bas : compteurs + Fermer (comme le vrai STCA) ────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 10px', background: '#FFFEF0', borderTop: '1px solid #E2E8F0',
        fontSize: 11, color: '#475569', flexShrink: 0,
      }}>
        <span>
          {active
            ? `${nbFrontieres} frontière(s) — ${totalVehicules} véhicule(s) sur la période`
            : ' '}
        </span>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          padding: '5px 16px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
          border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 600,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>✕ Fermer</button>
      </div>

      {alert && <WinAlert message={alert} onClose={() => setAlert(null)} />}
    </div>
  )
}
