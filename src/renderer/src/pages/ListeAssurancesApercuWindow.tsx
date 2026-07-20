import { useConfigAssurances } from '@mock/assurancesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu — « Liste des assurances - Groupement d'assurance » (bouton Imprimer
// de la Configuration Assurances). Fidèle à l'état du vrai STCA (capture 3 du
// 21/07/2026) : titre gris dégradé, table Nom | Coordonnées, compteur.
// Fenêtre BrowserWindow dédiée (Règle 10) — lit le store partagé directement.
// ─────────────────────────────────────────────────────────────────────────────

export default function ListeAssurancesApercuWindow(): JSX.Element {
  const cfg = useConfigAssurances()

  return (
    <div style={{ background: '#6B7280', minHeight: 'calc(100vh - 32px)', margin: -8, padding: 16 }}>
      {/* Barre d'actions */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, justifyContent: 'center' }}>
        <button onClick={() => window.print()} style={{
          height: 32, padding: '0 22px', background: '#2563EB', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>🖨 Imprimer</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          height: 32, padding: '0 18px', background: '#fff', color: '#DC2626',
          border: '1px solid #FECACA', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Fermer ⊗</button>
      </div>

      {/* Feuille A4 */}
      <div id="assur-liste-print-root" style={{
        width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)', padding: '22mm 18mm', boxSizing: 'border-box',
        fontFamily: "Arial, 'Segoe UI', sans-serif", color: '#111',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #F1F1F1, #D9D9D9)',
          border: '1px solid #BBB', textAlign: 'center',
          fontSize: '5mm', fontWeight: 700, padding: '2.5mm 0', marginBottom: '10mm',
        }}>
          Liste des assurances - Groupement d&apos;assurance
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '3.4mm' }}>
          <thead>
            <tr>
              {['Nom de l’assurance', 'Coordonnées'].map(h => (
                <th key={h} style={{
                  border: '1px solid #555', background: '#EFEDE4',
                  padding: '1.8mm 3mm', fontWeight: 700, textAlign: 'center',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cfg.assureurs.map(a => (
              <tr key={a.id}>
                <td style={{ border: '1px solid #555', padding: '1.8mm 3mm', fontWeight: 600 }}>{a.nom}</td>
                <td style={{ border: '1px solid #555', padding: '1.8mm 3mm' }}>{a.coordonnees}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '4mm', fontSize: '3.2mm' }}>
          Nombre d&apos;assurance(s) :&nbsp;&nbsp;&nbsp;<strong>{cfg.assureurs.length}</strong>
        </div>
      </div>

      {/* CSS d'impression : page A4, seule la feuille est imprimée */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #assur-liste-print-root, #assur-liste-print-root * { visibility: visible !important; }
          #assur-liste-print-root {
            position: fixed !important;
            left: 0 !important; top: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
    </div>
  )
}
