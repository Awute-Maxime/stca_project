import { useState, useMemo, type ReactNode } from 'react'
import { useVehicules } from '@mock/vehiculesStore'
import dayjs from 'dayjs'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { WinAlert } from '@components/WinDialogs'

export default function DestinationPage(): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto
  const todayISO = dayjs().format('YYYY-MM-DD')
  // Dates saisies vs appliquées — la recherche ne se lance qu'au CLIC sur 🔍
  // (pas d'autochargement, comme les autres fenêtres)
  const [from, setFrom] = useState(todayISO)
  const [to, setTo]     = useState(todayISO)
  const [appliedFrom, setAppliedFrom] = useState('')
  const [appliedTo, setAppliedTo] = useState('')
  const [active, setActive] = useState(false)
  const [alert, setAlert] = useState<ReactNode | null>(null)

  const doSearch = (): void => {
    setAppliedFrom(from)
    setAppliedTo(to)
    setActive(true)
  }

  // Aperçu dans sa propre BrowserWindow (Règle 10) — params via localStorage
  const openApercu = (): void => {
    if (!active || rows.length === 0) {
      setAlert(<>Aucune donnée à imprimer.<br />Sélectionnez une période et cliquez sur <strong>🔍</strong>.</>)
      return
    }
    localStorage.setItem('tcit_apercu_destination', JSON.stringify({ from: appliedFrom, to: appliedTo }))
    const cfg = WINDOW_REGISTRY['apercu.destination']
    if (cfg) electronApi.mdiOpen({ id: 'apercu.destination', x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
  }

  const { rows, total } = useMemo(() => {
    if (!active) return { rows: [] as Array<[string, { n: number; dt: string }]>, total: 0 }
    const counts: Record<string, { n: number; dt: string }> = {}
    for (const v of vehicules) {
      const d = v.date.slice(0, 10) // date seule (les mocks contiennent HH:mm)
      if (d < appliedFrom || d > appliedTo) continue
      if (!counts[v.destination]) counts[v.destination] = { n: 0, dt: v.date }
      counts[v.destination].n++
      counts[v.destination].dt = v.date
    }
    const entries = Object.entries(counts)
    const t = entries.reduce((s, [, d]) => s + d.n, 0)
    return { rows: entries, total: t }
  }, [vehicules, active, appliedFrom, appliedTo])

  const doReset = (): void => {
    setFrom(todayISO); setTo(todayISO)
    setAppliedFrom(''); setAppliedTo(''); setActive(false)
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'center', padding: '8px 14px',
    fontSize: 11.5, color: 'var(--tc-label)', fontWeight: 700,
    borderBottom: '2px solid var(--tc-fieldset-bd)', letterSpacing: 0.4,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--tc-card)' }}>

      {/* ── Barre filtres date ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderBottom: '2px solid var(--tc-fieldset-bd)',
        background: 'var(--tc-montant-bg)', flexShrink: 0,
      }}>
        <input type="date" className="light-input" value={from}
          onChange={e => setFrom(e.target.value)}
          style={{ width: 128, height: 26 }} />
        <input type="date" className="light-input" value={to}
          onChange={e => setTo(e.target.value)}
          style={{ width: 128, height: 26 }} />
        <button onClick={doSearch}
          style={{
            padding: '5px 14px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, lineHeight: 1,
          }}>🔍</button>
        <button onClick={doReset}
          style={{
            padding: '5px 14px', background: 'var(--tc-track)', color: 'var(--tc-label)',
            border: '1px solid var(--tc-fieldset-bd)', borderRadius: 4, cursor: 'pointer', fontSize: 13, lineHeight: 1,
          }}>↩</button>
      </div>

      {/* ── Tableau ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--tc-thead-bg)' }}>
              <th style={thStyle}>Frontières</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Enregistré le</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([code, d]) => (
              <tr key={code} style={{ borderBottom: '1px solid var(--tc-card-bd)' }}>
                <td style={{ textAlign: 'center', padding: '8px 14px', color: 'var(--accent)', fontWeight: 700 }}>{code}</td>
                <td style={{ textAlign: 'center', padding: '8px 14px', color: '#DC2626', fontWeight: 700 }}>{d.n}</td>
                <td style={{ textAlign: 'center', padding: '8px 14px', color: 'var(--tc-label)' }}>{dayjs(d.dt).format('DD/MM/YYYY')}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 40, color: 'var(--tc-subtle)', fontStyle: 'italic' }}>
                  {active ? 'Aucun véhicule pour cette période' : 'Sélectionnez une période puis cliquez sur 🔍'}
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: 'var(--tc-track)' }}>
              <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: 'var(--tc-text)', borderTop: '2px solid var(--tc-subtle)' }}>Somme</td>
              <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#DC2626', borderTop: '2px solid var(--tc-subtle)' }}>{total}</td>
              <td style={{ borderTop: '2px solid #94A3B8' }} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Boutons bas ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8,
        padding: '8px 12px', borderTop: '1px solid var(--tc-line)',
        background: 'var(--tc-section)', flexShrink: 0,
      }}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
          style={{
            height: 32, padding: '0 16px', background: 'var(--tc-section)', color: 'var(--tc-muted)',
            border: '1px solid var(--tc-th-bd)', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          }}>Fermer</button>
        <button onClick={openApercu}
          style={{
            height: 32, padding: '0 22px', background: 'var(--accent)', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>🖨 Imprimer le rapport</button>
      </div>

      {alert && <WinAlert message={alert} onClose={() => setAlert(null)} />}
    </div>
  )
}
