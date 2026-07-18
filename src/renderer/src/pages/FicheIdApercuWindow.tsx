import { useState, useEffect } from 'react'
import { FicheIdDoc, FicheIdPrintCss, type FicheIdData } from '@components/documents/FicheId'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu Fiche ID jaune dans sa PROPRE BrowserWindow (Règle 10) — même
// mécanique que les aperçus Carte Grise et Facture :
// - autoPrint=false : consultation, impression manuelle.
// - autoPrint=true : impression lancée après peinture ; écrit
//   localStorage('tcit_ficheid_printed') puis se ferme d'elle-même.
// Paramètres via localStorage('tcit_apercu_ficheId').
// Fond d'aperçu légèrement jaune : la fiche s'imprime sur PAPIER JAUNE.
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_ficheId'
export const FICHEID_PRINTED_KEY = 'tcit_ficheid_printed'

interface ApercuParams {
  data: FicheIdData
  autoPrint: boolean
  ts: number
}

const EMPTY_DATA: FicheIdData = {
  nom: '', pays: '', chassis: '', marque: '', parc: '',
  destCode: '', immat: '', numTri: '', dateTri: '',
}

function readParams(): ApercuParams {
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return { data: { ...EMPTY_DATA, ...p.data }, autoPrint: p.autoPrint ?? false, ts: p.ts ?? 0 }
  } catch {
    return { data: EMPTY_DATA, autoPrint: false, ts: 0 }
  }
}

export default function FicheIdApercuWindow(): JSX.Element {
  const [params, setParams] = useState<ApercuParams>(readParams)

  useEffect(() => {
    const onStorage = (e: StorageEvent): void => {
      if (e.key === LS_KEY && e.newValue) setParams(readParams())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  useEffect(() => {
    if (!params.autoPrint) return
    const t = setTimeout(() => {
      window.print()
      localStorage.setItem(FICHEID_PRINTED_KEY, String(params.ts || Date.now()))
      window.dispatchEvent(new CustomEvent('mdi:close-self'))
    }, 350)
    return () => clearTimeout(t)
  }, [params])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <FicheIdPrintCss />

      {params.autoPrint && (
        <div style={{
          padding: '6px 16px', background: '#FEF9C3', borderBottom: '1px solid #FDE047',
          fontSize: 11.5, color: '#854D0E', fontWeight: 600, flexShrink: 0,
        }}>
          🖨 Impression de la Fiche ID en cours… (papier jaune 10,5 × 21,2 cm)
        </div>
      )}

      {/* Zone aperçu — fiche centrée sur fond gris ; teinte jaune pâle pour
          évoquer le papier jaune (l'impression reste noire sur papier) */}
      <div style={{
        flex: 1, overflow: 'auto', background: '#94A3B8',
        display: 'flex', justifyContent: 'center', padding: 24, minHeight: 0,
      }}>
        <div style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.35)', height: 'fit-content', background: '#FFFBD6' }}>
          <div style={{ mixBlendMode: 'multiply' }}>
            <FicheIdDoc data={params.data} />
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
