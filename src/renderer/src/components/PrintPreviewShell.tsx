import type { ReactNode } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// Coquille commune des aperçus avant impression style WinDev (markup exact des
// aperçus Destination et Analyse du prototype) : barre d'onglets, barre de
// paramètres imprimante, miniature + zone page A4, footer Fermer / Lancer.
// Conçue pour remplir 100 % d'une BrowserWindow d'aperçu (Règle 10).
// ─────────────────────────────────────────────────────────────────────────────

export default function PrintPreviewShell({ thumbLabel, radioName, onClose, children }: {
  thumbLabel: string
  radioName: string
  onClose: () => void
  children: ReactNode
}): JSX.Element {
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
            <input type="radio" name={`${radioName}-color`} defaultChecked style={{ accentColor: '#2563EB' }} /> Couleur
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
            <input type="radio" name={`${radioName}-color`} style={{ accentColor: '#2563EB' }} /> Noir et blanc
          </label>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
            <input type="radio" name={`${radioName}-pages`} defaultChecked style={{ accentColor: '#2563EB' }} /> Toutes les pages
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#1E293B' }}>
            <input type="radio" name={`${radioName}-pages`} style={{ accentColor: '#2563EB' }} /> Page courante
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', color: '#94A3B8' }}>
            <input type="radio" name={`${radioName}-pages`} disabled style={{ accentColor: '#2563EB' }} /> Pages{' '}
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
            <div style={{ fontSize: 5, fontWeight: 700, textAlign: 'center', color: '#1E293B', marginBottom: 3 }}>{thumbLabel}</div>
            <div style={{ height: 2, background: '#CBD5E1', marginBottom: 2 }} />
            <div style={{ height: 30, background: '#F1F5F9', border: '1px solid #E2E8F0' }} />
            <div style={{ fontSize: 5, color: '#64748B', marginTop: 2, textAlign: 'center' }}>1</div>
          </div>
        </div>
        {/* Aperçu A4 */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24, display: 'flex', justifyContent: 'center' }}>
          <div style={{
            width: 595, minHeight: 842, background: '#fff', height: 'fit-content',
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)', padding: '48px 56px', fontFamily: 'Arial, sans-serif',
          }}>
            {children}
          </div>
        </div>
      </div>

      {/* Footer — .mft */}
      <div style={{
        padding: '12px 20px', borderTop: '1px solid #E2E8F0',
        display: 'flex', justifyContent: 'space-between', gap: 8,
        background: '#F8FAFF', flexShrink: 0,
      }}>
        <button onClick={onClose} style={{
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
  )
}
