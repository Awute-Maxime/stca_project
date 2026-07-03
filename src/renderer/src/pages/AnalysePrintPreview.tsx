import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { type MockVehicule } from '@mock/vehicules'
import { getAllVehicules } from '@mock/vehiculesStore'
import { mockDestinations } from '@mock/destinations'
import PrintPreviewShell from '@components/PrintPreviewShell'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu avant impression — Rapports d'analyse (TCIT détaillé / résumé /
// annuel + gain assurances). Rendu dans sa propre BrowserWindow (Règle 10) ;
// contenu A4 identique à l'ancien aperçu intégré d'AnalysePage.
// Paramètres transmis via localStorage('tcit_apercu_analyse').
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_analyse'

const FR_MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

function fmtDateFR(iso: string): string {
  return iso ? dayjs(iso).format('DD/MM/YYYY') : ''
}

function destLabel(code: string): string {
  return mockDestinations.find(d => d.code === code)?.nom ?? code
}

type GroupBy = 'jour' | 'mois' | 'destination'
type ReportSource = 'tcit_detail' | 'tcit_resume' | 'tcit_annual' | 'assurance'

interface ApercuParams {
  reportSource: ReportSource
  dateFrom: string
  dateTo: string
  groupBy: GroupBy
}

function readParams(): ApercuParams {
  const today = dayjs().format('YYYY-MM-DD')
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return {
      reportSource: p.reportSource ?? 'tcit_detail',
      dateFrom: p.dateFrom ?? today,
      dateTo: p.dateTo ?? today,
      groupBy: p.groupBy ?? 'jour',
    }
  } catch {
    return { reportSource: 'tcit_detail', dateFrom: today, dateTo: today, groupBy: 'jour' }
  }
}

export default function AnalysePrintPreview(): JSX.Element {
  const [params, setParams] = useState<ApercuParams>(readParams)

  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY && e.newValue) setParams(readParams())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const filtered = useMemo(() => {
    return getAllVehicules().filter(v => {
      const vDate = v.date.substring(0, 10)
      return vDate >= params.dateFrom && vDate <= params.dateTo
    })
  }, [params])

  const gainTotal = filtered.length * 2264

  return (
    <PrintPreviewShell
      thumbLabel={params.reportSource === 'assurance' ? 'Gain assurance...' : 'Rapport TCIT...'}
      radioName="anl"
      onClose={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
    >
      {params.reportSource === 'tcit_detail' && <ReportDetail data={filtered} groupBy={params.groupBy} dateFrom={params.dateFrom} dateTo={params.dateTo} />}
      {params.reportSource === 'tcit_resume' && <ReportResume data={filtered} groupBy={params.groupBy} dateFrom={params.dateFrom} dateTo={params.dateTo} />}
      {params.reportSource === 'tcit_annual' && <ReportAnnual data={filtered} dateFrom={params.dateFrom} dateTo={params.dateTo} />}
      {params.reportSource === 'assurance' && <ReportAssurance data={filtered} dateFrom={params.dateFrom} dateTo={params.dateTo} gainTotal={gainTotal} />}
    </PrintPreviewShell>
  )
}

/* ================================================================== */
/*  Report sub-components for A4 preview                               */
/* ================================================================== */

interface ReportProps {
  data: MockVehicule[]
  dateFrom: string
  dateTo: string
}

/* ── DETAIL report ──────────────────────────────────────────────────── */
function ReportDetail({ data, groupBy, dateFrom, dateTo }: ReportProps & { groupBy: GroupBy }): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  const groupTitle = groupBy === 'jour' ? 'jour' : groupBy === 'mois' ? 'mois' : 'destination'

  /* Group data */
  const groups = useMemo(() => {
    const map = new Map<string, typeof data>()
    for (const v of data) {
      let key: string
      if (groupBy === 'jour') {
        key = dayjs(v.date).format('DD/MM/YYYY')
      } else if (groupBy === 'mois') {
        const d = new Date(v.date)
        key = FR_MONTHS[d.getMonth()] + ' ' + d.getFullYear()
      } else {
        key = v.destination + ' — ' + destLabel(v.destination)
      }
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(v)
    }
    return Array.from(map.entries())
  }, [data, groupBy])

  const grandTotal = data.reduce((s, v) => s + v.montant, 0)

  const thS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '5px 8px', fontSize: 9.5,
    fontWeight: 700, background: '#F1F5F9', color: '#1E293B',
  }
  const tdS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '4px 8px', fontSize: 9, color: '#1E293B',
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Rapport détaillé par {groupTitle}
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      {groups.map(([label, items]) => {
        const subTotal = items.reduce((s, v) => s + v.montant, 0)
        return (
          <div key={label} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', marginBottom: 4, borderBottom: '1px solid #E2E8F0', paddingBottom: 2 }}>
              {label}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
              <thead>
                <tr>
                  <th style={thS}>Référence</th>
                  <th style={thS}>Nom</th>
                  <th style={thS}>Code/Date</th>
                  <th style={thS}>Immatriculation</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {items.map(v => (
                  <tr key={v.id}>
                    <td style={tdS}>{v.ref}</td>
                    <td style={tdS}>{v.nomAcheteur}</td>
                    <td style={tdS}>{v.destination}/{dayjs(v.date).format('DD/MM/YY')}</td>
                    <td style={{ ...tdS, fontWeight: 600 }}>{v.immat}</td>
                    <td style={{ ...tdS, textAlign: 'right' }}>{v.montant.toLocaleString('fr-FR')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', fontSize: 9.5, fontWeight: 700, color: '#1E293B' }}>
              Sous-total : {subTotal.toLocaleString('fr-FR')} FCFA ({items.length} véhicule{items.length > 1 ? 's' : ''})
            </div>
          </div>
        )
      })}

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 10, paddingTop: 8,
        textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#DC2626',
      }}>
        TOTAL GENERAL : {grandTotal.toLocaleString('fr-FR')} FCFA ({data.length} véhicule{data.length > 1 ? 's' : ''})
      </div>
    </div>
  )
}

/* ── RESUME report ──────────────────────────────────────────────────── */
function ReportResume({ data, groupBy, dateFrom, dateTo }: ReportProps & { groupBy: GroupBy }): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  const groupTitle = groupBy === 'jour' ? 'jour' : groupBy === 'mois' ? 'mois' : 'destination'

  const lines = useMemo(() => {
    const map = new Map<string, { count: number; montant: number }>()
    for (const v of data) {
      let key: string
      if (groupBy === 'jour') {
        key = dayjs(v.date).format('DD/MM/YYYY')
      } else if (groupBy === 'mois') {
        const d = new Date(v.date)
        key = FR_MONTHS[d.getMonth()] + ' ' + d.getFullYear()
      } else {
        key = v.destination + ' — ' + destLabel(v.destination)
      }
      const cur = map.get(key) ?? { count: 0, montant: 0 }
      map.set(key, { count: cur.count + 1, montant: cur.montant + v.montant })
    }
    return Array.from(map.entries())
  }, [data, groupBy])

  const grandTotal = data.reduce((s, v) => s + v.montant, 0)

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Rapport résumé par {groupTitle}
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      {lines.map(([label, val]) => (
        <div key={label} style={{ marginBottom: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#1E293B' }}>
            <span style={{ fontWeight: 600 }}>{label}</span>
            <span>{val.count} véh. — {val.montant.toLocaleString('fr-FR')} FCFA</span>
          </div>
          <div style={{ borderBottom: '1px dashed #CBD5E1', marginTop: 3 }} />
        </div>
      ))}

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 14, paddingTop: 8,
        textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#DC2626',
      }}>
        TOTAL GENERAL : {grandTotal.toLocaleString('fr-FR')} FCFA ({data.length} véhicule{data.length > 1 ? 's' : ''})
      </div>
    </div>
  )
}

/* ── ANNUAL report ──────────────────────────────────────────────────── */
function ReportAnnual({ data, dateFrom, dateTo }: ReportProps): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  const monthGroups = useMemo(() => {
    const map = new Map<number, Map<string, number>>()
    for (const v of data) {
      const d = new Date(v.date)
      const month = d.getMonth()
      if (!map.has(month)) map.set(month, new Map())
      const destMap = map.get(month)!
      destMap.set(v.destination, (destMap.get(v.destination) ?? 0) + v.montant)
    }
    return Array.from(map.entries()).sort((a, b) => a[0] - b[0])
  }, [data])

  const grandTotal = data.reduce((s, v) => s + v.montant, 0)

  const thS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '5px 8px', fontSize: 9.5,
    fontWeight: 700, background: '#F1F5F9', color: '#1E293B',
  }
  const tdS: React.CSSProperties = {
    border: '1px solid #CBD5E1', padding: '4px 8px', fontSize: 9, color: '#1E293B',
  }

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Rapport annuel
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      {monthGroups.map(([monthIdx, destMap]) => {
        const monthTotal = Array.from(destMap.values()).reduce((s, v) => s + v, 0)
        return (
          <div key={monthIdx} style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#2563EB', marginBottom: 4, borderBottom: '1px solid #E2E8F0', paddingBottom: 2 }}>
              {FR_MONTHS[monthIdx]}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 4 }}>
              <thead>
                <tr>
                  <th style={thS}>Destination</th>
                  <th style={{ ...thS, textAlign: 'right' }}>Montant</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(destMap.entries()).map(([dest, montant]) => (
                  <tr key={dest}>
                    <td style={tdS}>{dest} — {destLabel(dest)}</td>
                    <td style={{ ...tdS, textAlign: 'right' }}>{montant.toLocaleString('fr-FR')} FCFA</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ textAlign: 'right', fontSize: 9.5, fontWeight: 700, color: '#1E293B' }}>
              Sous-total {FR_MONTHS[monthIdx]} : {monthTotal.toLocaleString('fr-FR')} FCFA
            </div>
          </div>
        )
      })}

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 10, paddingTop: 8,
        textAlign: 'right', fontSize: 11, fontWeight: 700, color: '#DC2626',
      }}>
        TOTAL ANNUEL : {grandTotal.toLocaleString('fr-FR')} FCFA
      </div>
    </div>
  )
}

/* ── ASSURANCE report ───────────────────────────────────────────────── */
function ReportAssurance({ data, dateFrom, dateTo, gainTotal }: ReportProps & { gainTotal: number }): JSX.Element {
  const dateLabel = dateFrom === dateTo
    ? fmtDateFR(dateFrom)
    : `${fmtDateFR(dateFrom)} au ${fmtDateFR(dateTo)}`

  return (
    <div>
      <p style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 6px', color: '#1B3A6B' }}>
        Gain généré par les assurances
      </p>
      <p style={{ fontSize: 10, textAlign: 'center', margin: '0 0 18px', color: '#475569' }}>
        Période : {dateLabel}
      </p>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: 11 }}>
        <span>
          <span style={{ fontWeight: 600, color: '#374151' }}>Nbr de Véhicule(s) : </span>
          <span style={{ color: '#DC2626', fontWeight: 700 }}>{data.length}</span>
        </span>
        <span>
          <span style={{ fontWeight: 600, color: '#374151' }}>Gain Total : </span>
          <span style={{ color: '#DC2626', fontWeight: 700 }}>{gainTotal.toLocaleString('fr-FR')} FCFA</span>
        </span>
      </div>

      <div style={{
        borderTop: '2px solid #1B3A6B', marginTop: 10, paddingTop: 8,
        textAlign: 'center', fontSize: 10, color: '#64748B',
      }}>
        Type d&apos;assurance : POOL TPV VT - MOTO &mdash; Gain unitaire : 2 264 FCFA
      </div>
    </div>
  )
}
