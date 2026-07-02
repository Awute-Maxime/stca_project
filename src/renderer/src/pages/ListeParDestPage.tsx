import { useState, useMemo } from 'react'
import { DatePicker, notification } from 'antd'
import { SearchOutlined, PrinterOutlined, CloseOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useVehicules } from '@mock/vehiculesStore'
import { mockDestinations } from '@mock/destinations'

// Palette exacte du prototype (ligne 919)
const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}

function textOnBg(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#1E293B' : '#FFFFFF'
}

export default function ListeParDestPage(): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto
  const [from, setFrom] = useState(dayjs().subtract(30, 'day'))
  const [to, setTo] = useState(dayjs())
  const [active, setActive] = useState(false)

  const groups = useMemo(() => {
    if (!active) return null
    const fromStr = from.format('YYYY-MM-DD')
    const toStr = to.format('YYYY-MM-DD')
    const filtered = vehicules.filter(v => {
      const d = v.date.slice(0, 10) // date seule (les mocks contiennent HH:mm)
      return d >= fromStr && d <= toStr
    })
    const map = new Map<string, typeof filtered>()
    for (const v of filtered) {
      const list = map.get(v.destination) ?? []
      list.push(v)
      map.set(v.destination, list)
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([code, vehicles]) => ({
        code,
        nom: mockDestinations.find(d => d.code === code)?.nom ?? code,
        vehicles,
        total: vehicles.reduce((s, v) => s + v.montant, 0),
      }))
  }, [active, from, to])

  const grandTotal = groups?.reduce((s, g) => s + g.total, 0) ?? 0
  const totalVehicles = groups?.reduce((s, g) => s + g.vehicles.length, 0) ?? 0

  const thStyle: React.CSSProperties = {
    padding: '5px 10px', textAlign: 'left', fontSize: 11,
    fontWeight: 600, color: '#374151', background: '#F8FAFC',
    borderBottom: '1px solid #E2E8F0',
  }
  const tdStyle: React.CSSProperties = {
    padding: '4px 10px', fontSize: 11.5, borderBottom: '1px solid #F1F5F9',
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
          background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0, flexWrap: 'wrap',
        }}>
          <span style={{ fontSize: 11.5, color: '#374151' }}>Du :</span>
          <DatePicker size="small" value={from} onChange={v => v && setFrom(v)} format="DD/MM/YYYY" style={{ width: 120 }} />
          <span style={{ fontSize: 11.5, color: '#374151' }}>au :</span>
          <DatePicker size="small" value={to} onChange={v => v && setTo(v)} format="DD/MM/YYYY" style={{ width: 120 }} />
          <button
            onClick={() => setActive(true)}
            style={{
              padding: '4px 14px', fontSize: 11.5, fontWeight: 600, cursor: 'pointer',
              background: '#2563EB', color: '#fff', border: 'none', borderRadius: 5,
              display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            <SearchOutlined style={{ fontSize: 11 }} /> Actualiser
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          {!active && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>
              Cliquez sur Actualiser pour afficher la liste
            </div>
          )}
          {active && groups && groups.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: '#94A3B8', fontStyle: 'italic' }}>
              Aucun véhicule pour cette période
            </div>
          )}
          {active && groups && groups.map(g => {
            const bg = DEST_COLORS[g.code] ?? '#6B7280'
            return (
              <div key={g.code} style={{ margin: '8px 10px', border: '1px solid #E2E8F0', borderRadius: 6, overflow: 'hidden' }}>
                <div style={{
                  background: bg, color: textOnBg(bg),
                  padding: '6px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{g.code} — {g.nom}</span>
                  <span style={{ fontSize: 11 }}>
                    {g.vehicles.length} véhicule(s) — Total : {g.total.toLocaleString('fr-FR')} F
                  </span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Réf</th>
                      <th style={thStyle}>Nom et prénom</th>
                      <th style={thStyle}>Immatriculation</th>
                      <th style={thStyle}>Marque</th>
                      <th style={thStyle}>Date</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Montant</th>
                    </tr>
                  </thead>
                  <tbody>
                    {g.vehicles.map(v => (
                      <tr key={v.id}>
                        <td style={{ ...tdStyle, color: '#64748B' }}>{v.ref}</td>
                        <td style={{ ...tdStyle, fontWeight: 500 }}>{v.nomAcheteur}</td>
                        <td style={tdStyle}>
                          <span style={{
                            fontFamily: 'monospace', fontWeight: 700, fontSize: 11,
                            color: '#1B3A6B', background: '#EFF6FF',
                            padding: '1px 6px', borderRadius: 3,
                          }}>
                            {v.immat}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: '#475569' }}>{v.marqueModele}</td>
                        <td style={{ ...tdStyle, color: '#475569' }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', fontWeight: 600, color: '#16A34A' }}>
                          {v.montant.toLocaleString('fr-FR')} F
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          })}
        </div>

        {/* Status bar */}
        <div style={{
          padding: '4px 10px', background: '#FFFEF0', borderTop: '1px solid #E2E8F0',
          fontSize: 11, color: '#475569', flexShrink: 0,
        }}>
          {active && groups
            ? `${groups.length} destination(s) — ${totalVehicles} véhicule(s) — Total : ${grandTotal.toLocaleString('fr-FR')} FCFA`
            : ' '
          }
        </div>
      </div>

      {/* Side panel */}
      <div style={{
        width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 5,
        padding: '7px 6px', background: '#F8FAFF', borderLeft: '1px solid #E2E8F0',
      }}>
        <button
          onClick={() => notification.info({ message: 'Impression liste par destination...', placement: 'bottomRight' })}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <PrinterOutlined /> Imprimer
        </button>
        <div style={{ flex: 1 }} />
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
          style={{
            width: '100%', padding: '5px 6px', fontSize: 11, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 600,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <CloseOutlined /> Fermer
        </button>
      </div>
    </div>
  )
}
