import { useState, useEffect } from 'react'
import { Feuillet3Doc, Feuillet3PrintCss, type Feuillet3Data } from '@components/documents/Feuillet3'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu Feuillet N°3 Conditions Particulières dans sa PROPRE BrowserWindow
// (Règle 10) — même mécanique que Carte Grise / Facture / Fiche ID :
// - autoPrint=false : consultation, impression manuelle.
// - autoPrint=true : impression après peinture ; écrit
//   localStorage('tcit_feuillet3_printed') puis se ferme d'elle-même.
// Paramètres via localStorage('tcit_apercu_feuillet3').
// Aperçu = données seules sur feuille blanche (papier PRÉ-IMPRIMÉ réel).
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_feuillet3'
export const FEUILLET3_PRINTED_KEY = 'tcit_feuillet3_printed'

interface ApercuParams {
  data: Feuillet3Data
  autoPrint: boolean
  ts: number
}

const EMPTY_DATA: Feuillet3Data = {
  numPolice: '', dateEffet: '', dateEcheance: '', parc: '', nom: '',
  paysResidence: '', paysDestination: '', categorieUsage: '', marque: '',
  chassis: '', immatStac: '', mention: '',
}

function readParams(): ApercuParams {
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return { data: { ...EMPTY_DATA, ...p.data }, autoPrint: p.autoPrint ?? false, ts: p.ts ?? 0 }
  } catch {
    return { data: EMPTY_DATA, autoPrint: false, ts: 0 }
  }
}

export default function Feuillet3ApercuWindow(): JSX.Element {
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
      localStorage.setItem(FEUILLET3_PRINTED_KEY, String(params.ts || Date.now()))
      window.dispatchEvent(new CustomEvent('mdi:close-self'))
    }, 350)
    return () => clearTimeout(t)
  }, [params])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Feuillet3PrintCss />

      {params.autoPrint && (
        <div style={{
          padding: '6px 16px', background: '#FEF9C3', borderBottom: '1px solid #FDE047',
          fontSize: 11.5, color: '#854D0E', fontWeight: 600, flexShrink: 0,
        }}>
          🖨 Impression du Feuillet N°3 en cours… (feuillet pré-imprimé A4)
        </div>
      )}

      {/* Zone aperçu — données seules sur feuille blanche, fond gris */}
      <div style={{
        flex: 1, overflow: 'auto', background: '#94A3B8',
        display: 'flex', justifyContent: 'center', padding: 24, minHeight: 0,
      }}>
        {/* Chaque exemplaire porte sa propre ombre (2 pages) */}
        <div style={{ height: 'fit-content' }}>
          <Feuillet3Doc data={params.data} />
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
