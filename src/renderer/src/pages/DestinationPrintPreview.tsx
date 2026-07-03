import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { getAllVehicules } from '@mock/vehiculesStore'
import PrintPreviewShell from '@components/PrintPreviewShell'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu avant impression — Nombre Véhicules par Frontières (fenêtre
// Destination). Rendu dans sa propre BrowserWindow (Règle 10) ; le contenu A4
// est identique à l'ancien aperçu intégré (fidèle prototype).
// Paramètres transmis via localStorage('tcit_apercu_destination').
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_destination'

interface ApercuParams { from: string; to: string }

function readParams(): ApercuParams {
  const today = dayjs().format('YYYY-MM-DD')
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return { from: p.from ?? today, to: p.to ?? today }
  } catch {
    return { from: today, to: today }
  }
}

export default function DestinationPrintPreview(): JSX.Element {
  const [params, setParams] = useState<ApercuParams>(readParams)

  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY && e.newValue) setParams(readParams())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const { rows, total } = useMemo(() => {
    const counts: Record<string, { n: number; dt: string }> = {}
    for (const v of getAllVehicules()) {
      const d = v.date.slice(0, 10)
      if (d < params.from || d > params.to) continue
      if (!counts[v.destination]) counts[v.destination] = { n: 0, dt: v.date }
      counts[v.destination].n++
      counts[v.destination].dt = v.date
    }
    const entries = Object.entries(counts)
    return { rows: entries, total: entries.reduce((s, [, d]) => s + d.n, 0) }
  }, [params])

  const fmtDate = (d: string): string => d ? dayjs(d).format('DD/MM/YYYY') : '—'
  const dateLabel = params.from === params.to
    ? fmtDate(params.from)
    : `${fmtDate(params.from)} au ${fmtDate(params.to)}`

  return (
    <PrintPreviewShell
      thumbLabel="Nbr de véhicules..."
      radioName="dp"
      onClose={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
    >
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 18px', color: '#1E293B' }}>
        Nbr de véhicules par destination pour la journée du&nbsp;: <span style={{ color: '#2563EB' }}>{dateLabel}</span>
      </p>
      <table style={{ margin: '0 auto', borderCollapse: 'collapse', fontSize: 12, minWidth: 380 }}>
        <thead>
          <tr style={{ background: '#F1F5F9' }}>
            <th style={{ border: '1px solid #CBD5E1', padding: '7px 20px' }}>Code</th>
            <th style={{ border: '1px solid #CBD5E1', padding: '7px 20px' }}>Nbr</th>
            <th style={{ border: '1px solid #CBD5E1', padding: '7px 20px' }}>Enregistré le</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(([code, d]) => (
            <tr key={code}>
              <td style={{ border: '1px solid #CBD5E1', padding: '6px 20px', textAlign: 'center', fontWeight: 700, color: '#1E293B' }}>{code}</td>
              <td style={{ border: '1px solid #CBD5E1', padding: '6px 20px', textAlign: 'center', fontWeight: 700, color: '#DC2626' }}>{d.n}</td>
              <td style={{ border: '1px solid #CBD5E1', padding: '6px 20px', textAlign: 'center', color: '#475569' }}>{dayjs(d.dt).format('DD/MM/YYYY')}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td style={{ padding: '7px 12px', fontWeight: 700, textAlign: 'right', border: 'none' }}>TOTAL :</td>
            <td style={{ padding: '7px 12px', fontWeight: 700, color: '#DC2626', border: 'none' }}>{total}</td>
            <td style={{ border: 'none' }} />
          </tr>
        </tfoot>
      </table>
    </PrintPreviewShell>
  )
}
