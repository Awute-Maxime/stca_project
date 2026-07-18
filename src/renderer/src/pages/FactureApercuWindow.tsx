import { useState, useEffect } from 'react'
import { FactureDoc, FacturePrintCss, type FactureData, MONTANT_ASSURANCE_FACTURE } from '@components/documents/Facture'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu Facture dans sa PROPRE BrowserWindow (Règle 10) — même mécanique que
// l'aperçu Carte Grise :
// - autoPrint=false (bouton Aperçu) : consultation, impression manuelle.
// - autoPrint=true (Imprimer + Prévisualiser coché) : aperçu peint, impression
//   lancée aussitôt ; la fenêtre écrit localStorage('tcit_facture_printed')
//   (signal pour la fenêtre Enregistrement) puis se ferme d'elle-même.
// Paramètres via localStorage('tcit_apercu_facture').
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_facture'
export const FACTURE_PRINTED_KEY = 'tcit_facture_printed'

interface ApercuParams {
  data: FactureData
  autoPrint: boolean
  ts: number
}

const EMPTY_DATA: FactureData = {
  factureNum: '', dateEnreg: '', nom: '', pays: '', destCode: '', immat: '',
  chassis: '', marque: '', natureVeh: '',
  montantStca: 0, montantAssurance: MONTANT_ASSURANCE_FACTURE,
}

function readParams(): ApercuParams {
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return { data: { ...EMPTY_DATA, ...p.data }, autoPrint: p.autoPrint ?? false, ts: p.ts ?? 0 }
  } catch {
    return { data: EMPTY_DATA, autoPrint: false, ts: 0 }
  }
}

export default function FactureApercuWindow(): JSX.Element {
  const [params, setParams] = useState<ApercuParams>(readParams)

  // Rafraîchit si l'Enregistrement relance un aperçu/une impression alors que
  // la fenêtre est déjà ouverte (le ts change à chaque demande)
  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY && e.newValue) setParams(readParams())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  // Mode autoPrint : laisse la facture se peindre, imprime, signale, se ferme
  useEffect(() => {
    if (!params.autoPrint) return
    const t = setTimeout(() => {
      window.print()
      localStorage.setItem(FACTURE_PRINTED_KEY, String(params.ts || Date.now()))
      window.dispatchEvent(new CustomEvent('mdi:close-self'))
    }, 350)
    return () => clearTimeout(t)
  }, [params])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <FacturePrintCss />

      {/* Bandeau statut en mode impression automatique */}
      {params.autoPrint && (
        <div style={{
          padding: '6px 16px', background: '#FEF9C3', borderBottom: '1px solid #FDE047',
          fontSize: 11.5, color: '#854D0E', fontWeight: 600, flexShrink: 0,
        }}>
          🖨 Impression de la Facture en cours… (A4)
        </div>
      )}

      {/* Zone aperçu — page A4 centrée sur fond gris */}
      <div style={{
        flex: 1, overflow: 'auto', background: '#94A3B8',
        display: 'flex', justifyContent: 'center', padding: 24, minHeight: 0,
      }}>
        <div style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.35)', height: 'fit-content' }}>
          <FactureDoc data={params.data} />
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
