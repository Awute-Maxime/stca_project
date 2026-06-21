import { useState, useMemo } from 'react'
import { mockVehicules } from '@mock/vehicules'
import dayjs from 'dayjs'

export default function DestinationPage(): JSX.Element {
  const todayISO = dayjs().format('YYYY-MM-DD')
  const [from, setFrom] = useState(todayISO)
  const [to, setTo]     = useState(todayISO)
  const [printOpen, setPrintOpen] = useState(false)

  const { rows, total } = useMemo(() => {
    const counts: Record<string, { n: number; dt: string }> = {}
    for (const v of mockVehicules) {
      if (v.date < from || v.date > to) continue
      if (!counts[v.destination]) counts[v.destination] = { n: 0, dt: v.date }
      counts[v.destination].n++
      counts[v.destination].dt = v.date
    }
    const entries = Object.entries(counts)
    const t = entries.reduce((s, [, d]) => s + d.n, 0)
    return { rows: entries, total: t }
  }, [from, to])

  const doReset = (): void => { setFrom(todayISO); setTo(todayISO) }

  const fmtDate = (d: string): string => d ? dayjs(d).format('DD/MM/YYYY') : '—'
  const dateLabel = from === to ? fmtDate(from) : `${fmtDate(from)} au ${fmtDate(to)}`

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
        <button onClick={() => setPrintOpen(true)}
          style={{
            height: 32, padding: '0 22px', background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>🖨 Imprimer le rapport</button>
      </div>

      {/* ── Modal Aperçu Impression ────────────────────────────────────── */}
      {printOpen && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 800,
        }}>
          <div style={{
            background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: 820, maxWidth: '95vw', maxHeight: '92vh',
            display: 'flex', flexDirection: 'column', animation: 'formEnter 0.2s ease',
          }}>
            {/* Titlebar — .mh */}
            <div style={{
              display: 'flex', alignItems: 'center', padding: '14px 20px',
              borderBottom: '1px solid #E2E8F0', background: '#1B3A6B', borderRadius: '10px 10px 0 0',
            }}>
              <span style={{ fontSize: 12, marginRight: 8 }}>🖨</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Liste des Véhicules par destination</span>
              <button onClick={() => setPrintOpen(false)} style={{
                width: 26, height: 26, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
                cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: 4, transition: 'all 0.15s',
              }}
                onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.15)'; b.style.color = '#fff' }}
                onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'none'; b.style.color = 'rgba(255,255,255,0.6)' }}
              >✕</button>
            </div>

            {/* Toolbar onglets */}
            <div style={{
              display: 'flex', alignItems: 'center', borderBottom: '1px solid #E2E8F0',
              background: '#F8FAFF', padding: '0 12px', flexShrink: 0,
            }}>
              <button style={{ padding: '8px 16px', fontSize: 11.5, fontWeight: 700, color: '#2563EB', border: 'none', borderBottom: '2px solid #2563EB', background: 'none', cursor: 'pointer' }}>👁 Aperçu</button>
              <button onClick={() => window.print()} style={{ padding: '8px 16px', fontSize: 11.5, color: '#475569', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent' }}>🖨 Imprimer</button>
              <button style={{ padding: '8px 16px', fontSize: 11.5, color: '#475569', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent' }}>📤 Exporter</button>
              <button style={{ padding: '8px 16px', fontSize: 11.5, color: '#475569', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent' }}>🔍 Rechercher</button>
              <button style={{ padding: '8px 16px', fontSize: 11.5, color: '#475569', border: 'none', background: 'none', cursor: 'pointer', borderBottom: '2px solid transparent' }}>✏️ Annoter</button>
              <span style={{ marginLeft: 'auto', fontSize: 11, color: '#94A3B8', paddingRight: 8 }}>100 %</span>
            </div>

            {/* Barre paramètres impression */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '8px 16px',
              borderBottom: '1px solid #E2E8F0', background: '#fff', fontSize: 11.5, flexShrink: 0,
            }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
                border: '1px solid #CBD5E1', borderRadius: 5, minWidth: 180,
              }}>
                <span style={{ fontSize: 18 }}>🖨</span>
                <div>
                  <div style={{ fontWeight: 600, color: '#1E293B', fontSize: 11 }}>AnyDesk Printer</div>
                  <div style={{ color: '#16A34A', fontSize: 10 }}>Prêt</div>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="dp-color" defaultChecked style={{ accentColor: '#2563EB' }} /> Couleur
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="dp-color" style={{ accentColor: '#2563EB' }} /> Noir et blanc
                </label>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="dp-pages" defaultChecked style={{ accentColor: '#2563EB' }} /> Toutes les pages
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
                  <input type="radio" name="dp-pages" style={{ accentColor: '#2563EB' }} /> Page courante
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#94A3B8' }}>
                  <input type="radio" name="dp-pages" disabled style={{ accentColor: '#2563EB' }} /> Pages{' '}
                  <input type="text" placeholder="1-10, 25-30, 35" disabled style={{
                    width: 110, border: '1px solid #D1D5DB', borderRadius: 3, padding: '2px 5px', fontSize: 10, color: '#94A3B8',
                  }} />
                </label>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <span style={{ color: '#475569' }}>Copies</span>
                <input type="number" defaultValue={1} min={1} style={{
                  width: 50, border: '1px solid #D1D5DB', borderRadius: 4, padding: '3px 6px', fontSize: 12, textAlign: 'center',
                }} />
              </div>
            </div>

            {/* Corps : miniature + aperçu A4 */}
            <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', background: '#94A3B8', minHeight: 0 }}>
              {/* Miniature */}
              <div style={{ width: 110, background: '#64748B', padding: 10, flexShrink: 0, overflowY: 'auto' }}>
                <div style={{
                  background: '#fff', border: '1px solid #475569', padding: 4, marginBottom: 6,
                  cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                }}>
                  <div style={{ fontSize: 5, fontWeight: 700, textAlign: 'center', color: '#1E293B', marginBottom: 3 }}>Nbr de véhicules...</div>
                  <div style={{ height: 2, background: '#CBD5E1', marginBottom: 2 }} />
                  <div style={{ height: 30, background: '#F1F5F9', border: '1px solid #E2E8F0' }} />
                  <div style={{ fontSize: 5, color: '#64748B', marginTop: 2, textAlign: 'center' }}>1</div>
                </div>
              </div>
              {/* Aperçu A4 */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
                <div style={{
                  width: 595, minHeight: 842, background: '#fff',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.25)', padding: '48px 56px', fontFamily: 'Arial, sans-serif',
                }}>
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
                </div>
              </div>
            </div>

            {/* Footer — .mft */}
            <div style={{
              padding: '12px 20px', borderTop: '1px solid #E2E8F0',
              display: 'flex', justifyContent: 'space-between', gap: 8,
              background: '#F8FAFF', borderRadius: '0 0 10px 10px',
            }}>
              <button onClick={() => setPrintOpen(false)} style={{
                height: 34, padding: '0 16px', background: '#fff', color: '#374151',
                border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
              }}>✕ Fermer</button>
              <button onClick={() => window.print()} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px',
                background: '#2563EB', color: '#fff', border: 'none', borderRadius: 5,
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}>
                <span style={{ fontSize: 18 }}>🖨</span> Lancer l&apos;impression
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
