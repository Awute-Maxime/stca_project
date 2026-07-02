import { useState, useEffect, useMemo } from 'react'
import dayjs from 'dayjs'
import { getAllVehicules } from '@mock/vehiculesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu avant impression — Liste des Véhicules (contenu fidèle au prototype
// m-liste-print). Rendu dans sa PROPRE BrowserWindow MDI (Règle 10) : la
// fenêtre est donc réellement libre — déplaçable/redimensionnable partout à
// l'écran, pas emprisonnée dans la fenêtre Liste.
//
// Les paramètres de filtre sont transmis par la fenêtre Liste via
// localStorage('tcit_apercu_liste') ; l'event `storage` permet de rafraîchir
// si l'utilisateur relance Imprimer avec d'autres dates pendant que
// l'aperçu est déjà ouvert.
// ─────────────────────────────────────────────────────────────────────────────

const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}

interface ApercuParams {
  from: string
  to: string
  pointage: 'sortie' | 'non_sortie' | 'toutes'
  frFilter: string
}

const LS_KEY = 'tcit_apercu_liste'

function readParams(): ApercuParams {
  const today = dayjs().format('YYYY-MM-DD')
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return {
      from: p.from ?? today,
      to: p.to ?? today,
      pointage: p.pointage ?? 'toutes',
      frFilter: p.frFilter ?? '',
    }
  } catch {
    return { from: today, to: today, pointage: 'toutes', frFilter: '' }
  }
}

export default function ListePrintPreview(): JSX.Element {
  const [params, setParams] = useState<ApercuParams>(readParams)

  // Rafraîchit si la fenêtre Liste relance Imprimer avec de nouveaux filtres
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
      if (d < params.from || d > params.to) return false
      if (params.frFilter && v.destination !== params.frFilter.toUpperCase()) return false
      if (params.pointage === 'sortie' && !v.recyclerPlaque) return false
      if (params.pointage === 'non_sortie' && v.recyclerPlaque) return false
      return true
    })
  }, [params])

  const sorties = filtered.filter(v => v.recyclerPlaque).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* Barre outils impression — prototype exact */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
        background: '#F8FAFF', borderBottom: '1px solid #E2E8F0', flexShrink: 0,
      }}>
        <button onClick={() => window.print()} style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 16px',
          fontSize: 12, fontWeight: 700, background: '#2563EB', color: '#fff',
          border: 'none', borderRadius: 5, cursor: 'pointer',
        }}>🖨 Lancer l&apos;impression</button>
        <span style={{ fontSize: 11, color: '#94A3B8' }}>|</span>
        <span style={{ fontSize: 11, color: '#475569' }}>A4 Paysage</span>
        <div style={{ flex: 1 }} />
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          padding: '4px 14px', fontSize: 11.5, background: '#fff', color: '#374151',
          border: '1px solid #D1D5DB', borderRadius: 5, cursor: 'pointer',
        }}>Fermer</button>
      </div>

      {/* Zone rapport */}
      <div style={{ flex: 1, overflow: 'auto', background: '#E5E7EB', padding: 20 }}>
        <div style={{
          background: '#fff', width: '100%', minHeight: 500,
          padding: '28px 32px', boxShadow: '0 2px 12px rgba(0,0,0,0.12)',
        }}>
          {/* Titre rapport — encadré */}
          <div style={{
            textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#1E293B',
            background: '#F1F5F9', border: '1px solid #CBD5E1',
            padding: '8px 16px', marginBottom: 16,
          }}>
            Liste des véhicules enregistrés pour la période du : {dayjs(params.from).format('DD/MM/YYYY')} &nbsp;au&nbsp; {dayjs(params.to).format('DD/MM/YYYY')}
          </div>

          {/* Table rapport — en-tête navy */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 10.5 }}>
            <thead>
              <tr style={{ background: '#1B3A6B', color: '#fff' }}>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Ref</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Nom et prénom</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Adresse</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', textAlign: 'center' }}>Code</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Immatriculation</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Marque et modèle</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>N° Chassis</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap', textAlign: 'center' }}>N° de Tri</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap' }}>Parc</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap', textAlign: 'center' }}>Date</th>
                <th style={{ padding: '5px 6px', border: '1px solid #CBD5E1', whiteSpace: 'nowrap', textAlign: 'center' }}>Sortie le</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v, i) => {
                const bg = DEST_COLORS[v.destination] ?? '#6B7280'
                return (
                  <tr key={v.id} style={{ background: i % 2 === 0 ? '#fff' : '#F8FAFF' }}>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0' }}>{v.ref}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontWeight: 500 }}>{v.nomAcheteur || '—'}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0' }}>{v.paysResidence || '—'}</td>
                    <td style={{
                      padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center',
                      fontWeight: 700, color: destTxt(bg), background: bg,
                    }}>{v.destination}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontWeight: 700 }}>{v.immat}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0' }}>{v.marqueModele}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontFamily: "'Courier New', monospace", fontSize: 9.5 }}>{v.chassis}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>{String(10000 + v.id).padStart(6, '0')}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', fontSize: 9.5 }}>{v.parc || ''}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center' }}>{dayjs(v.date).format('DD/MM/YYYY')}</td>
                    <td style={{ padding: '4px 6px', border: '1px solid #E2E8F0', textAlign: 'center', color: '#94A3B8' }}>
                      {v.recyclerPlaque ? dayjs(v.date).add(1, 'day').format('DD/MM/YYYY') : '__/__'}
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: 30, color: '#94A3B8', fontStyle: 'italic', border: '1px solid #E2E8F0' }}>
                    Aucun véhicule pour cette période
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pied de rapport */}
          <div style={{ marginTop: 14, fontSize: 11, color: '#1E293B', display: 'flex', gap: 40 }}>
            <span>Nombre de véhicules &nbsp; <strong>{filtered.length}</strong></span>
            <span>Nombre de véhicules sorties : &nbsp; <strong>{sorties}</strong></span>
          </div>
        </div>
      </div>
    </div>
  )
}
