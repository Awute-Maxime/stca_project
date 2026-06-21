import { useState } from 'react'
import type { ReactNode } from 'react'

// ── WinAlert — ⚠️ alerte centrée dans la fenêtre ─────────────────────────
export function WinAlert({ message, onClose }: { message: ReactNode; onClose: () => void }): JSX.Element {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto', background: '#fff', border: '2px solid #F59E0B',
        borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        padding: '22px 32px', maxWidth: 380, textAlign: 'center',
        animation: 'formEnter 0.18s ease',
      }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚠️</div>
        <div style={{ fontSize: 12.5, color: '#1E293B', fontWeight: 600, lineHeight: 1.7 }}>{message}</div>
        <button onClick={onClose} style={{
          marginTop: 14, padding: '5px 22px', background: '#F59E0B', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
        }}>OK</button>
      </div>
    </div>
  )
}

// ── WinConfirm — ⚠️ confirmation Oui/Non centrée ─────────────────────────
export function WinConfirm({ message, onOui, onNon }: {
  message: ReactNode; onOui: () => void; onNon: () => void
}): JSX.Element {
  return (
    <div style={{
      position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 9999, pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto', background: '#fff', border: '1px solid #CBD5E1',
        borderRadius: 8, boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '24px 32px', maxWidth: 360, textAlign: 'center',
        animation: 'formEnter 0.18s ease',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 16 }}>
          <span style={{ fontSize: 32, lineHeight: 1 }}>⚠️</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', lineHeight: 1.5, textAlign: 'left' }}>{message}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          <button onClick={onOui} style={{
            padding: '6px 28px', background: '#2563EB', color: '#fff',
            border: 'none', borderRadius: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer',
          }}>Oui</button>
          <button onClick={onNon} style={{
            padding: '6px 28px', background: '#F1F5F9', color: '#1E293B',
            border: '1px solid #CBD5E1', borderRadius: 5, fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Non</button>
        </div>
      </div>
    </div>
  )
}

// ── EditionDocsModal — DUPLICATA / Renouvellement ─────────────────────────
const DOC_OPTIONS = [
  { value: 'tous', label: '— Tous (Facture - CG - Assurances) —', highlight: true },
  { value: 'facture_cg', label: 'Facture + Carte Grise' },
  { value: 'cg_fiche_id', label: 'Carte Grise + Fiche ID Jaune' },
  { value: 'toutes_assur', label: 'Toutes Assurances' },
  { value: 'sep', label: '' },
  { value: 'uniq_facture', label: 'Uniquement Facture' },
  { value: 'uniq_cg', label: 'Uniquement Carte Grise' },
  { value: 'uniq_fiche_id', label: 'Uniquement Fiche ID Jaune' },
  { value: 'feuillet1', label: 'Feuillet N°1 Assurance (Bleu)' },
  { value: 'feuillet2', label: 'Feuillet N° 2 Assurance (Rose)' },
  { value: 'feuillet3', label: 'Feuillet N° 3 Cond. Part. (Blanc A4)' },
]

export function EditionDocsModal({ type, onClose, onPrint }: {
  type: 'duplicata' | 'renouvel'
  onClose: () => void
  onPrint: (docType: string, preview: boolean) => void
}): JSX.Element {
  const [selected, setSelected] = useState('tous')
  const [preview, setPreview] = useState(false)
  const title = type === 'duplicata' ? 'Edition Documents : DUPLICATA' : 'Edition Documents : Renouvel.'

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 800,
    }}>
      <div style={{
        background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: 340, padding: 0,
        animation: 'formEnter 0.2s ease',
      }}>
        {/* Titlebar */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '14px 20px',
          borderBottom: '1px solid #E2E8F0', background: '#1B3A6B', borderRadius: '10px 10px 0 0',
        }}>
          <span style={{ fontSize: 12, marginRight: 8 }}>🖨</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>{title}</span>
          <button onClick={onClose} style={{
            width: 26, height: 26, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
            cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4,
          }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ background: '#fff', padding: '14px 16px' }}>
          <fieldset style={{ border: '1px solid #CBD5E1', borderRadius: 6, padding: '10px 14px', margin: 0 }}>
            <legend style={{ fontSize: 11, fontWeight: 700, color: '#1B3A6B', padding: '0 6px' }}>Documents à imprimer</legend>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {DOC_OPTIONS.map((opt, i) => {
                if (opt.value === 'sep') return <hr key={i} style={{ border: 'none', borderTop: '1px solid #E2E8F0', margin: '4px 0' }} />
                return (
                  <label key={opt.value} style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: opt.highlight ? '5px 6px' : '4px 6px',
                    borderRadius: opt.highlight ? 4 : 0,
                    background: opt.highlight ? '#EFF6FF' : 'transparent',
                    cursor: 'pointer',
                    fontSize: opt.highlight ? 12 : 11.5,
                    fontWeight: opt.highlight ? 700 : 400,
                    color: opt.highlight ? '#1B3A6B' : '#1E293B',
                  }}>
                    <input type="radio" name="ed-doc" value={opt.value}
                      checked={selected === opt.value} onChange={() => setSelected(opt.value)}
                      style={{ accentColor: '#2563EB' }} />
                    {opt.label}
                  </label>
                )
              })}
            </div>
          </fieldset>

          {/* Bas : Prévisualiser + Imprimer */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#475569', cursor: 'pointer' }}>
              <input type="checkbox" checked={preview} onChange={e => setPreview(e.target.checked)}
                style={{ accentColor: '#2563EB' }} /> Prévisualiser
            </label>
            <button onClick={() => onPrint(selected, preview)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 18px',
              background: '#2563EB', color: '#fff', border: 'none', borderRadius: 5,
              fontSize: 12, fontWeight: 700, cursor: 'pointer',
            }}>🖨 Imprimer</button>
          </div>
        </div>
      </div>
    </div>
  )
}
