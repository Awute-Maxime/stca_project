import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import 'dayjs/locale/fr'
import { getAllVehicules } from '@mock/vehiculesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu avant impression — Montant à restituer (Minimum ou Détaillé).
// Rendu dans sa propre BrowserWindow (Règle 10) ; contenu identique à
// l'ancien aperçu intégré de MontantRestituerWindow.
// Paramètres transmis via localStorage('tcit_apercu_montantRestituer').
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_montantRestituer'

interface ApercuParams {
  from: string
  to: string
  mode: 'minimum' | 'detail'
}

function readParams(): ApercuParams {
  const today = dayjs().format('YYYY-MM-DD')
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return { from: p.from ?? today, to: p.to ?? today, mode: p.mode ?? 'minimum' }
  } catch {
    return { from: today, to: today, mode: 'minimum' }
  }
}

export default function MontantRestituerPrintPreview(): JSX.Element {
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
      const d = v.date.slice(0, 10)
      return d >= params.from && d <= params.to
    })
  }, [params])

  const totalRestituer = filtered.reduce((s, v) => s + Math.round(v.montant * 0.78), 0)
  const sorties = filtered.filter(v => v.recyclerPlaque).length
  const { from, to, mode } = params

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: '#fff' }}>

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
        <button onClick={() => window.print()} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 16px',
          background: '#3C7D3C', color: '#fff', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 700, cursor: 'pointer',
        }}><span style={{ fontSize: 20 }}>🖨</span>Lancer l&apos;impression</button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 10px', border: '1px solid #CBD5E1', borderRadius: 5 }}>
          <span style={{ fontSize: 18 }}>🖨</span>
          <div><div style={{ fontWeight: 600, color: '#1E293B', fontSize: 11 }}>AnyDesk Printer</div><div style={{ color: '#16A34A', fontSize: 10 }}>Prêt</div></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="mr-color" defaultChecked style={{ accentColor: '#2563EB' }} /> Couleur</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="mr-color" style={{ accentColor: '#2563EB' }} /> Noir et blanc</label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="mr-pages" defaultChecked style={{ accentColor: '#2563EB' }} /> Toutes les pages</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer' }}><input type="radio" name="mr-pages" style={{ accentColor: '#2563EB' }} /> Page courante</label>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
          <span style={{ color: '#475569' }}>Copies</span>
          <input type="number" defaultValue={1} min={1} style={{ width: 50, border: '1px solid #D1D5DB', borderRadius: 4, padding: '3px 6px', fontSize: 12, textAlign: 'center' }} />
        </div>
      </div>

      {/* Corps : miniature + aperçu A4 (portrait Minimum / paysage Détaillé) */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: '#94A3B8', minHeight: 0 }}>
        <div style={{ width: 110, background: '#64748B', padding: 10, flexShrink: 0, overflowY: 'auto' }}>
          <div style={{ background: '#fff', border: '1px solid #475569', padding: 4, cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.3)', marginBottom: 6 }}>
            <div style={{ fontSize: 5, fontWeight: 700, textAlign: 'center', color: '#1E293B', marginBottom: 2 }}>Montant restitué...</div>
            <div style={{ height: 2, background: '#CBD5E1', marginBottom: 2 }} />
            <div style={{ height: 30, background: '#F1F5F9', border: '1px solid #E2E8F0' }} />
            <div style={{ fontSize: 5, color: '#64748B', marginTop: 2, textAlign: 'center' }}>1</div>
          </div>
        </div>
        <div style={{ flex: 1, overflow: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: mode === 'detail' ? 842 : 595, minHeight: mode === 'detail' ? 595 : 842,
            background: '#fff', boxShadow: '0 4px 20px rgba(0,0,0,0.25)', padding: '48px 56px',
            fontFamily: 'Arial, sans-serif', height: 'fit-content', flexShrink: 0,
          }}>
            {mode === 'minimum' ? (
              <>
                <h2 style={{ fontSize: 14, fontWeight: 700, textAlign: 'center', margin: '0 0 30px', background: '#E8E8E8', padding: '10px 16px' }}>
                  Montant restitué pour la période du : {dayjs(from).format('DD/MM/YYYY')} au {dayjs(to).format('DD/MM/YYYY')}
                </h2>
                <p style={{ fontSize: 13, margin: '16px 0' }}><strong>Assurance :</strong> &nbsp; POOL TPV VT - MOTO</p>
                <p style={{ fontSize: 13, margin: '12px 0' }}><strong>Nombre de Véhicules :</strong> &nbsp; {filtered.length.toLocaleString('fr-FR')}</p>
                <p style={{ fontSize: 13, margin: '12px 0' }}><strong>Nombre de Véhicules sorties :</strong> &nbsp; {sorties.toLocaleString('fr-FR')}</p>
                <p style={{ fontSize: 14, margin: '16px 0' }}><strong>Montant Total Restitué :</strong> &nbsp; <span style={{ color: '#DC2626', fontWeight: 800, fontSize: 16 }}>{totalRestituer.toLocaleString('fr-FR')}</span></p>
                <p style={{ fontSize: 13, margin: '24px 0 0' }}><strong>Fait le :</strong> &nbsp; {dayjs().locale('fr').format('dddd D MMMM YYYY')}</p>
                <div style={{ marginTop: 40, border: '1px solid #1E293B', padding: '12px 16px', minHeight: 100, width: 300 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B' }}>Cachet et Signature</div>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ fontSize: 13, fontWeight: 700, textAlign: 'center', margin: '0 0 8px', background: '#E8E8E8', padding: '8px 12px' }}>
                  Montant restitué pour la période du : {dayjs(from).format('DD/MM/YYYY')} au {dayjs(to).format('DD/MM/YYYY')}
                </h2>
                <p style={{ fontSize: 11, margin: '0 0 12px' }}><strong>Assurance :</strong> &nbsp; POOL TPV VT - MOTO</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 9.5 }}>
                  <thead><tr style={{ background: '#F1F5F9' }}>
                    {['Ref', 'Nom et prénom', 'Adresse', 'Type', 'Marque et modèle', 'N° Chassis', 'Immatriculation', 'Destination', 'N° de Tri', 'Enregistré le', 'Montant', 'Sortie le'].map(h => (
                      <th key={h} style={{ border: '1px solid #CBD5E1', padding: '3px 4px', textAlign: 'left', fontSize: 8.5, fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {filtered.slice(0, 50).map(v => (
                      <tr key={v.id}>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{v.ref}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{v.nomAcheteur}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{v.paysResidence}/{v.paysDestination || v.paysResidence}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{v.typeVehicule}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{v.marqueModele}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px', fontFamily: 'monospace', fontSize: 8 }}>{v.chassis}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{v.immat}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px', textAlign: 'center' }}>{v.destination}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px', textAlign: 'center' }}>{String(10000 + v.id).padStart(6, '0')}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px', textAlign: 'right' }}>{Math.round(v.montant * 0.78).toLocaleString('fr-FR')}</td>
                        <td style={{ border: '1px solid #E2E8F0', padding: '2px 4px' }}>{v.recyclerPlaque ? dayjs(v.date).add(1, 'day').format('DD/MM/YYYY') : ''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ textAlign: 'right', fontSize: 9, color: '#64748B', marginTop: 4 }}>1 / ...</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-between', background: '#F8FAFF', flexShrink: 0,
      }}>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          height: 34, padding: '0 16px', background: '#fff', color: '#374151',
          border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
        }}>✕ Fermer</button>
        <button onClick={() => window.print()} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px',
          background: '#2563EB', color: '#fff', border: 'none', borderRadius: 5,
          fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}><span style={{ fontSize: 18 }}>🖨</span> Lancer l&apos;impression</button>
      </div>
    </div>
  )
}
