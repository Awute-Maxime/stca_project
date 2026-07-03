import { useState, useMemo } from 'react'
import { useVehicules } from '@mock/vehiculesStore'
import dayjs from 'dayjs'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'

export default function DestinationPage(): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto
  const todayISO = dayjs().format('YYYY-MM-DD')
  const [from, setFrom] = useState(todayISO)
  const [to, setTo]     = useState(todayISO)

  // Aperçu dans sa propre BrowserWindow (Règle 10) — params via localStorage
  const openApercu = (): void => {
    localStorage.setItem('tcit_apercu_destination', JSON.stringify({ from, to }))
    const cfg = WINDOW_REGISTRY['apercu.destination']
    if (cfg) electronApi.mdiOpen({ id: 'apercu.destination', x: cfg.defaultX, y: cfg.defaultY, width: cfg.width, height: cfg.height })
  }

  const { rows, total } = useMemo(() => {
    const counts: Record<string, { n: number; dt: string }> = {}
    for (const v of vehicules) {
      const d = v.date.slice(0, 10) // date seule (les mocks contiennent HH:mm)
      if (d < from || d > to) continue
      if (!counts[v.destination]) counts[v.destination] = { n: 0, dt: v.date }
      counts[v.destination].n++
      counts[v.destination].dt = v.date
    }
    const entries = Object.entries(counts)
    const t = entries.reduce((s, [, d]) => s + d.n, 0)
    return { rows: entries, total: t }
  }, [vehicules, from, to])

  const doReset = (): void => { setFrom(todayISO); setTo(todayISO) }

  const thStyle: React.CSSProperties = {
    textAlign: 'center', padding: '8px 14px',
    fontSize: 11.5, color: '#475569', fontWeight: 700,
    borderBottom: '2px solid #CBD5E1', letterSpacing: 0.4,
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fff' }}>

      {/* ── Barre filtres date ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 12px', borderBottom: '2px solid #CBD5E1',
        background: '#F0F4FF', flexShrink: 0,
      }}>
        <input type="date" className="light-input" value={from}
          onChange={e => setFrom(e.target.value)}
          style={{ width: 128, height: 26 }} />
        <input type="date" className="light-input" value={to}
          onChange={e => setTo(e.target.value)}
          style={{ width: 128, height: 26 }} />
        <button
          style={{
            padding: '5px 14px', background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, lineHeight: 1,
          }}>🔍</button>
        <button onClick={doReset}
          style={{
            padding: '5px 14px', background: '#E2E8F0', color: '#475569',
            border: '1px solid #CBD5E1', borderRadius: 4, cursor: 'pointer', fontSize: 13, lineHeight: 1,
          }}>↩</button>
      </div>

      {/* ── Tableau ────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#EEF2F9' }}>
              <th style={thStyle}>Frontières</th>
              <th style={thStyle}>Nombre</th>
              <th style={thStyle}>Enregistré le</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([code, d]) => (
              <tr key={code} style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ textAlign: 'center', padding: '8px 14px', color: '#2563EB', fontWeight: 700 }}>{code}</td>
                <td style={{ textAlign: 'center', padding: '8px 14px', color: '#DC2626', fontWeight: 700 }}>{d.n}</td>
                <td style={{ textAlign: 'center', padding: '8px 14px', color: '#475569' }}>{dayjs(d.dt).format('DD/MM/YYYY')}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>
                  Aucun véhicule pour cette période
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr style={{ background: '#F1F5F9' }}>
              <td style={{ padding: '8px 14px', fontSize: 12, fontWeight: 700, color: '#1E293B', borderTop: '2px solid #94A3B8' }}>Somme</td>
              <td style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#DC2626', borderTop: '2px solid #94A3B8' }}>{total}</td>
              <td style={{ borderTop: '2px solid #94A3B8' }} />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* ── Boutons bas ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', gap: 8,
        padding: '8px 12px', borderTop: '1px solid #E2E8F0',
        background: '#F8FAFF', flexShrink: 0,
      }}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
          style={{
            height: 32, padding: '0 16px', background: '#F8FAFF', color: '#64748B',
            border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
          }}>Fermer</button>
        <button onClick={openApercu}
          style={{
            height: 32, padding: '0 22px', background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>🖨 Imprimer le rapport</button>
      </div>

    </div>
  )
}
