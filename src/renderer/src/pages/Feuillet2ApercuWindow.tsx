import { useState, useEffect } from 'react'
import { Feuillet2Doc, Feuillet2PrintCss, type Feuillet2Data } from '@components/documents/Feuillet2'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu Feuillet N°2 Assurance (Rose) dans sa PROPRE BrowserWindow
// (Règle 10) — même mécanique que les autres documents :
// - autoPrint=false : consultation, impression manuelle.
// - autoPrint=true : impression après peinture ; écrit
//   localStorage('tcit_feuillet2_printed') puis se ferme d'elle-même.
// Paramètres via localStorage('tcit_apercu_feuillet2').
// Fond d'aperçu rosé : la bande pré-imprimée réelle est ROSE (Carte Brune CEDEAO).
// ─────────────────────────────────────────────────────────────────────────────

const LS_KEY = 'tcit_apercu_feuillet2'
export const FEUILLET2_PRINTED_KEY = 'tcit_feuillet2_printed'

interface ApercuParams {
  data: Feuillet2Data
  autoPrint: boolean
  ts: number
}

const EMPTY_DATA: Feuillet2Data = {
  nom: '', numPolice: '', dateEffet: '', dateEcheance: '',
  marque: '', immatStac: '', chassis: '',
}

function readParams(): ApercuParams {
  try {
    const p = JSON.parse(localStorage.getItem(LS_KEY) ?? '{}') as Partial<ApercuParams>
    return { data: { ...EMPTY_DATA, ...p.data }, autoPrint: p.autoPrint ?? false, ts: p.ts ?? 0 }
  } catch {
    return { data: EMPTY_DATA, autoPrint: false, ts: 0 }
  }
}

export default function Feuillet2ApercuWindow(): JSX.Element {
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
      localStorage.setItem(FEUILLET2_PRINTED_KEY, String(params.ts || Date.now()))
      window.dispatchEvent(new CustomEvent('mdi:close-self'))
    }, 350)
    return () => clearTimeout(t)
  }, [params])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <Feuillet2PrintCss />

      {params.autoPrint && (
        <div style={{
          padding: '6px 16px', background: '#FEF9C3', borderBottom: '1px solid #FDE047',
          fontSize: 11.5, color: '#854D0E', fontWeight: 600, flexShrink: 0,
        }}>
          🖨 Impression du Feuillet N°2 en cours… (bande pré-imprimée rose 28,2 × 7,51 cm)
        </div>
      )}

      {/* Zone aperçu — bande centrée sur fond gris, teinte bleutée (papier rose) */}
      <div style={{
        flex: 1, overflow: 'auto', background: '#94A3B8',
        display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 24, minHeight: 0,
      }}>
        <div style={{ boxShadow: '0 4px 20px rgba(0,0,0,0.35)', height: 'fit-content', background: '#FFEDF2', flexShrink: 0 }}>
          <div style={{ mixBlendMode: 'multiply' }}>
            <Feuillet2Doc data={params.data} />
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
