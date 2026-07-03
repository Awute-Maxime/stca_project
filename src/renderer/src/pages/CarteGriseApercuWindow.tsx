import { useState, useEffect } from 'react'
import { CarteGriseDoc, PrintCss, type CarteGriseData } from '@components/documents/CarteGrise'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu Carte Grise dans sa PROPRE BrowserWindow (Règle 10) — la fiche
// 10,5 × 21,2 cm (801 px) n'est plus emprisonnée dans la fenêtre
// Enregistrement (640 px).
//
// Deux modes, pilotés par la fenêtre Enregistrement via
// localStorage('tcit_apercu_carteGrise') :
// - autoPrint=false (bouton Aperçu) : consultation, impression manuelle.
// - autoPrint=true (Imprimer + Prévisualiser coché) : aperçu rapide peint puis
//   impression lancée aussitôt sans validation ; à la fin la fenêtre écrit
//   localStorage('tcit_cg_printed') (event storage → notification côté
//   Enregistrement) et se ferme d'elle-même.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_carteGrise'
export const CG_PRINTED_KEY = 'tcit_cg_printed'

interface ApercuParams {
  data: CarteGriseData
  autoPrint: boolean
  ts: number
}

const EMPTY_DATA: CarteGriseData = {
  immat: '', destCode: '', nom: '', adresse: '', numTri: '',
  dateTri: '', marque: '', chassis: '', parc: '', dateDelivrance: '',
}

function readParams(): ApercuParams {
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return { data: { ...EMPTY_DATA, ...p.data }, autoPrint: p.autoPrint ?? false, ts: p.ts ?? 0 }
  } catch {
    return { data: EMPTY_DATA, autoPrint: false, ts: 0 }
  }
}

export default function CarteGriseApercuWindow(): JSX.Element {
  const [params, setParams] = useState<ApercuParams>(readParams)

  // Rafraîchit si Enregistrement relance un aperçu/une impression pendant
  // que la fenêtre est déjà ouverte (le ts change à chaque demande)
  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY && e.newValue) setParams(readParams())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Mode autoPrint : laisse la fiche se peindre, imprime, signale, se ferme
  useEffect(() => {
    if (!params.autoPrint) return
    const t = setTimeout(() => {
      window.print()
      localStorage.setItem(CG_PRINTED_KEY, String(params.ts || Date.now()))
      window.dispatchEvent(new CustomEvent('mdi:close-self'))
    }, 350)
    return () => clearTimeout(t)
  }, [params])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <PrintCss />

      {/* Bandeau statut en mode impression automatique */}
      {params.autoPrint && (
        <div style={{
          padding: '6px 16px', background: '#FEF9C3', borderBottom: '1px solid #FDE047',
          fontSize: 11.5, color: '#854D0E', fontWeight: 600, flexShrink: 0,
        }}>
          🖨 Impression Carte Grise en cours… (fiche pré-imprimée 10,5 × 21,2 cm)
        </div>
      )}

      {/* Zone aperçu — fiche centrée sur fond gris */}
      <div style={{
        flex: 1, overflow: 'auto', background: '#94A3B8',
        display: 'flex', justifyContent: 'center', padding: 24, minHeight: 0,
      }}>
        <div style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.35)', height: 'fit-content' }}>
          <CarteGriseDoc data={params.data} />
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
        {!params.autoPrint && (
          <button onClick={() => window.print()} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '7px 20px',
            background: '#2563EB', color: '#fff', border: 'none', borderRadius: 5,
            fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>
            <span style={{ fontSize: 18 }}>🖨</span> Lancer l&apos;impression
          </button>
        )}
      </div>
    </div>
  )
}
