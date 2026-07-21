import { useDestinations } from '@mock/destinationsStore'

// ─────────────────────────────────────────────────────────────────────────────
// Aperçu — « Liste des destinations » (bouton Imprimer de Paramètres
// Destinations). Table Code | Tarif | Destination | Lettre | N° immatriculation
// + pastille couleur de plaque. Fenêtre BrowserWindow dédiée (Règle 10) — lit le
// store partagé directement.
// ─────────────────────────────────────────────────────────────────────────────

export default function ListeDestinationsApercuWindow(): JSX.Element {
  const dests = useDestinations()

  const th: React.CSSProperties = {
    border: '1px solid #555', background: '#EFEDE4', padding: '1.8mm 3mm', fontWeight: 700, textAlign: 'center',
  }
  const td: React.CSSProperties = { border: '1px solid #555', padding: '1.6mm 3mm' }

  return (
    <div style={{ background: '#6B7280', minHeight: 'calc(100vh - 32px)', margin: -8, padding: 16 }}>
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

      <div id="dest-liste-print-root" style={{
        width: '210mm', minHeight: '297mm', margin: '0 auto', background: '#fff',
        boxShadow: '0 4px 20px rgba(0,0,0,0.35)', padding: '22mm 18mm', boxSizing: 'border-box',
        fontFamily: "Arial, 'Segoe UI', sans-serif", color: '#111',
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #F1F1F1, #D9D9D9)',
          border: '1px solid #BBB', textAlign: 'center',
          fontSize: '5mm', fontWeight: 700, padding: '2.5mm 0', marginBottom: '10mm',
        }}>
          Liste des destinations
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '3.4mm' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '16mm' }}>Couleur</th>
              <th style={{ ...th, width: '20mm' }}>Code</th>
              <th style={{ ...th, width: '26mm' }}>Tarif</th>
              <th style={th}>Destination</th>
              <th style={{ ...th, width: '16mm' }}>Lettre</th>
              <th style={{ ...th, width: '30mm' }}>N° immat.</th>
            </tr>
          </thead>
          <tbody>
            {dests.map(d => (
              <tr key={d.code}>
                <td style={{ ...td, textAlign: 'center' }}>
                  <span style={{ display: 'inline-block', width: '4mm', height: '4mm', borderRadius: '1mm', background: d.couleur, border: '0.3mm solid #555' }} />
                </td>
                <td style={{ ...td, fontWeight: 700, textAlign: 'center' }}>{d.code}</td>
                <td style={{ ...td, textAlign: 'right' }}>{d.tarif.toLocaleString('fr-FR')}</td>
                <td style={td}>{d.nom}</td>
                <td style={{ ...td, textAlign: 'center', fontWeight: 700 }}>{d.lettre}</td>
                <td style={{ ...td, textAlign: 'right', fontFamily: 'monospace' }}>{String(d.numImmatActuel).padStart(4, '0')}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: '4mm', fontSize: '3.2mm' }}>
          Nombre de destination(s) :&nbsp;&nbsp;&nbsp;<strong>{dests.length}</strong>
        </div>
      </div>

      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 0; }
          body * { visibility: hidden !important; }
          #dest-liste-print-root, #dest-liste-print-root * { visibility: visible !important; }
          #dest-liste-print-root {
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
