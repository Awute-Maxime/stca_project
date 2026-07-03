import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { getAllVehicules } from '@mock/vehiculesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu avant impression — Liste des Véhicules par destination.
// Rapport A4 PORTRAIT fidèle au vrai STCA II : bandeau-titre gris
// « Nbr de véhicules par destination pour la période du : X au : Y »,
// table centrée Code | Nbr | Enregistré le (Nbr en ROUGE), une ligne par
// (frontière, jour). Rendu dans sa propre BrowserWindow (Règle 10).
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_listeParDest'

// À l'impression : seule la page A4 sort (barre d'outils, fond gris et ombre masqués)
const PRINT_CSS = `
@media print {
  @page { size: A4 portrait; margin: 12mm; }
  .lpd-noprint { display: none !important; }
  .lpd-zone { overflow: visible !important; background: #fff !important; padding: 0 !important; }
  .lpd-page { box-shadow: none !important; width: auto !important; min-height: 0 !important; padding: 0 !important; }
}`

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

export default function ListeParDestPrintPreview(): JSX.Element {
  const [params, setParams] = useState<ApercuParams>(readParams)

  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY && e.newValue) setParams(readParams())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const rows = useMemo(() => {
    const counts = new Map<string, { code: string; date: string; n: number }>()
    for (const v of getAllVehicules()) {
      const d = v.date.slice(0, 10)
      if (d < params.from || d > params.to) continue
      const key = `${v.destination}|${d}`
      const entry = counts.get(key)
      if (entry) entry.n++
      else counts.set(key, { code: v.destination, date: d, n: 1 })
    }
    return Array.from(counts.values()).sort((a, b) =>
      a.code === b.code ? a.date.localeCompare(b.date) : a.code.localeCompare(b.code)
    )
  }, [params])

  const total = rows.reduce((s, r) => s + r.n, 0)

  // Cellules du rapport — bordures fines style STCA II réel
  const rTh: React.CSSProperties = {
    border: '1px solid #555', padding: '5px 24px', background: '#E8EEF4',
    fontSize: 12, fontWeight: 700, color: '#1E293B', textAlign: 'center', whiteSpace: 'nowrap',
  }
  const rTd: React.CSSProperties = {
    border: '1px solid #888', padding: '4px 24px', fontSize: 11.5, textAlign: 'center', whiteSpace: 'nowrap',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <style>{PRINT_CSS}</style>

      {/* Barre outils impression */}
      <div className="lpd-noprint" style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
        background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
      }}>
        <button onClick={() => window.print()} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 16px',
          fontSize: 12, fontWeight: 700, background: '#2563EB', color: '#fff',
          border: 'none', borderRadius: 5, cursor: 'pointer',
        }}>🖨 Lancer l&apos;impression</button>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>|</span>
        <span style={{ fontSize: 11, color: '#475569' }}>A4 Portrait</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          padding: '4px 14px', fontSize: 11.5, background: '#fff', color: '#374151',
          border: '1px solid #D1D5DB', borderRadius: 5, cursor: 'pointer',
        }}>Fermer</button>
      </div>

      {/* Zone rapport — page A4 portrait */}
      <div className="lpd-zone" style={{ flex: 1, overflow: 'auto', background: '#E5E7EB', padding: 20, display: 'flex', justifyContent: 'center' }}>
        <div className="lpd-page" style={{
          background: '#fff', width: 595, minHeight: 842, flexShrink: 0,
          padding: '40px 44px', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
          fontFamily: 'Arial, sans-serif', height: 'fit-content',
        }}>
          {/* Bandeau-titre — comme le rapport STCA II réel */}
          <div style={{
            textAlign: 'center', fontSize: 13.5, fontWeight: 700, color: '#1E293B',
            background: '#E8E8E8', padding: '8px 12px', marginBottom: 28,
          }}>
            Nbr de véhicules par destination pour la période du : {dayjs(params.from).format('DD/MM/YYYY')} &nbsp;au : {dayjs(params.to).format('DD/MM/YYYY')}
          </div>

          {/* Table centrée Code | Nbr | Enregistré le */}
          <table style={{ margin: '0 auto', borderCollapse: 'collapse', minWidth: 400 }}>
            <thead>
              <tr>
                <th style={rTh}>Code</th>
                <th style={rTh}>Nbr</th>
                <th style={rTh}>Enregistré le</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={`${r.code}-${r.date}`}>
                  <td style={{ ...rTd, fontWeight: 700, color: '#1E293B' }}>{r.code}</td>
                  <td style={{ ...rTd, fontWeight: 700, color: '#DC2626' }}>{r.n}</td>
                  <td style={{ ...rTd, color: '#1E293B' }}>{dayjs(r.date).format('DD/MM/YYYY')}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td style={{ padding: '7px 12px', fontWeight: 700, textAlign: 'right', border: 'none', fontSize: 12 }}>TOTAL :</td>
                <td style={{ padding: '7px 12px', fontWeight: 700, color: '#DC2626', border: 'none', textAlign: 'center', fontSize: 12 }}>{total}</td>
                <td style={{ border: 'none' }} />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  )
}
