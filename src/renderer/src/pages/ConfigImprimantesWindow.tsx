import { useState, useEffect } from 'react'
import { notification } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { electronApi } from '@api/electron'
import { getConfigImpression, setConfigImpression, type ConfigImpression, type DocCalibrable } from '@mock/printConfig'
import { ouvrirApercuDoc } from '@components/documents/editionHelpers'
import { getAllVehicules } from '@mock/vehiculesStore'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DES ÉDITIONS ET IMPRIMANTES — fidèle à la fenêtre du vrai
// STCA II (capture fournie le 25/07/2026) :
// - une imprimante par document (factures, cartes grises, feuillets 1/2/3,
//   fiche ID), remplies avec les VRAIES imprimantes du PC + défaut système,
// - type d'imprimante pour les feuillets 1/2 (Rouleau / Laser),
// - options : Imprimer Fiche ID, Nom État Cond. Part., code-barres facture,
// + NOUVEAU : CALIBRAGE des positions d'impression par document pré-imprimé
//   (décalage global X/Y en mm, persisté, appliqué à toutes les impressions).
// ─────────────────────────────────────────────────────────────────────────────

const DOCS_IMPRIMANTES: Array<{ cle: keyof ConfigImpression['imprimantes']; label: string }> = [
  { cle: 'facture',   label: "Imprimante pour l'édition des factures" },
  { cle: 'cg',        label: "Imprimante pour l'édition des Cartes Grise" },
  { cle: 'feuillet1', label: "Imprimante pour l'édition du Feuillet d'assurance N°1 ( Bleu )" },
  { cle: 'feuillet2', label: "Imprimante pour l'édition du Feuillet d'assurance N°2 ( Rose )" },
  { cle: 'feuillet3', label: "Imprimante pour l'édition du Feuillet d'assurance N°3 ( Cond. Part. )" },
  { cle: 'ficheId',   label: "Imprimante pour l'édition de la Fiche ID du véhicule" },
]

const DOCS_CALIBRABLES: Array<{ cle: DocCalibrable; label: string }> = [
  { cle: 'cg',        label: 'Carte Grise (10,5 × 21,2 cm)' },
  { cle: 'ficheId',   label: 'Fiche ID (10,5 × 21,2 cm)' },
  { cle: 'feuillet1', label: 'Feuillet N°1 Bleu (28,2 × 7,51 cm)' },
  { cle: 'feuillet2', label: 'Feuillet N°2 Rose (28,2 × 7,51 cm)' },
  { cle: 'feuillet3', label: 'Feuillet N°3 Cond. Part. (A4)' },
]

export function ConfigImprimantesWindow(): JSX.Element {
  const [cfg, setCfg] = useState<ConfigImpression>(getConfigImpression)
  const [imprimantes, setImprimantes] = useState<Array<{ name: string; isDefault: boolean }>>([])
  const [docCal, setDocCal] = useState<DocCalibrable>('cg')

  const parDefaut = imprimantes.find(p => p.isDefault)?.name ?? ''

  // Vraies imprimantes du système ; le défaut système remplit les champs vides
  useEffect(() => {
    void electronApi.printersList().then(liste => {
      setImprimantes(liste)
      const defaut = liste.find(p => p.isDefault)?.name
      if (defaut) {
        setCfg(prev => {
          const impr = { ...prev.imprimantes }
          for (const d of DOCS_IMPRIMANTES) if (!impr[d.cle]) impr[d.cle] = defaut
          return { ...prev, imprimantes: impr }
        })
      }
    })
  }, [])

  const majCalibrage = (axe: 'dx' | 'dy', delta: number): void => {
    setCfg(prev => ({
      ...prev,
      calibrage: {
        ...prev.calibrage,
        [docCal]: {
          ...prev.calibrage[docCal],
          [axe]: Math.round((prev.calibrage[docCal][axe] + delta) * 2) / 2, // pas de 0,5 mm
        },
      },
    }))
  }

  const valider = (): void => {
    setConfigImpression(cfg)
    notification.success({
      message: '✅ Configuration des imprimantes enregistrée',
      description: 'Imprimantes, options et calibrages sont appliqués à toutes les impressions.',
      placement: 'bottomRight',
    })
  }

  const testImpression = (): void => {
    // Sauvegarde d'abord le calibrage courant, puis ouvre l'aperçu du document
    // avec un véhicule d'exemple : l'utilisateur imprime sur le pré-imprimé
    // réel et vérifie l'alignement.
    setConfigImpression(cfg)
    const v = getAllVehicules()[0]
    if (!v) return
    ouvrirApercuDoc(docCal, v, false, Date.now())
    notification.info({
      message: '🖨 Page de test ouverte',
      description: 'Lancez l\'impression sur le pré-imprimé réel pour vérifier l\'alignement, puis ajustez le décalage.',
      placement: 'bottomRight',
    })
  }

  const cal = cfg.calibrage[docCal]

  // ── Styles ────────────────────────────────────────────────────────────────
  const LBL: React.CSSProperties = { fontSize: 11.5, fontWeight: 700, color: '#1B3A6B', marginBottom: 3 }
  const SEL: React.CSSProperties = {
    width: '100%', height: 28, fontSize: 12, padding: '0 8px',
    border: '1px solid #D1D5DB', borderRadius: 4, background: '#fff', color: '#1E293B',
  }
  const FS: React.CSSProperties = { border: '1px solid #CBD5E1', borderRadius: 6, padding: '8px 14px', margin: '10px 0' }
  const LEG: React.CSSProperties = { fontSize: 10.5, fontWeight: 600, color: '#475569', padding: '0 6px' }
  const RADIO: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1E293B', cursor: 'pointer' }
  const STEP: React.CSSProperties = {
    width: 26, height: 26, border: '1px solid #CBD5E1', borderRadius: 4, background: '#F8FAFF',
    color: '#1B3A6B', fontWeight: 700, cursor: 'pointer', fontSize: 13, lineHeight: 1,
  }

  return (
    <div style={{ animation: 'formEnter 0.3s ease', paddingBottom: 8 }}>
      {/* Sub-header beige (modèle Enregistrement) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <PrinterOutlined style={{ color: '#1B3A6B', fontSize: 15 }} />
        <span style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
          Configuration des éditions et imprimantes
        </span>
        <span style={{ fontSize: 10.5, color: '#64748B' }}>
          Imprimante par défaut du système :&nbsp;
          <strong style={{ color: '#16A34A' }}>{parDefaut || 'détection…'}</strong>
        </span>
      </div>

      {/* ── Une imprimante par document (modèle STCA) ─────────────────────── */}
      {DOCS_IMPRIMANTES.map(d => (
        <div key={d.cle} style={{ marginBottom: 8 }}>
          <div style={LBL}>{d.label}</div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <select style={SEL} value={cfg.imprimantes[d.cle]}
              onChange={e => setCfg(prev => ({ ...prev, imprimantes: { ...prev.imprimantes, [d.cle]: e.target.value } }))}>
              {imprimantes.length === 0 && <option value="">— aucune imprimante détectée —</option>}
              {imprimantes.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name}{p.isDefault ? '   (par défaut du système)' : ''}
                </option>
              ))}
            </select>
            <span style={{ fontSize: 15, flexShrink: 0 }}>🖨</span>
          </div>

          {/* Type d'imprimante pour les feuillets 1/2 — sous le feuillet 2, comme le vrai STCA */}
          {d.cle === 'feuillet2' && (
            <fieldset style={FS}>
              <legend style={LEG}>· Type Imprimante pour Feuillets Assurance N° 1/2 ·</legend>
              <div style={{ display: 'flex', gap: 26 }}>
                {(['rouleau', 'laser'] as const).map(t => (
                  <label key={t} style={RADIO}>
                    <input type="radio" name="type-f12" checked={cfg.typeFeuillets12 === t}
                      onChange={() => setCfg(prev => ({ ...prev, typeFeuillets12: t }))}
                      style={{ accentColor: '#2563EB' }} />
                    {t === 'rouleau' ? 'Rouleau' : 'Laser'}
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
      ))}

      {/* ── Options d'édition (modèle STCA) ───────────────────────────────── */}
      <label style={{ ...RADIO, fontWeight: 700, color: '#1D4ED8', margin: '4px 0 8px' }}>
        <input type="checkbox" checked={cfg.imprimerFicheId}
          onChange={e => setCfg(prev => ({ ...prev, imprimerFicheId: e.target.checked }))}
          style={{ accentColor: '#2563EB' }} />
        Imprimer Fiche ID Véhicule
      </label>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1B3A6B', whiteSpace: 'nowrap' }}>Nom Etat Cond. Part. :</span>
        <input className="light-input" value={cfg.nomEtatCondPart}
          onChange={e => setCfg(prev => ({ ...prev, nomEtatCondPart: e.target.value }))}
          style={{ width: 280, height: 26, fontWeight: 600, color: '#1D4ED8' }} />
        <button title="Nom du modèle d'état utilisé pour le Feuillet N°3" style={{
          width: 26, height: 26, border: '1px solid #CBD5E1', borderRadius: 4,
          background: '#F8FAFF', color: '#1B3A6B', fontWeight: 700, cursor: 'help',
        }}>?</button>
      </div>

      <fieldset style={FS}>
        <legend style={LEG}>· Etat Facture Global ·</legend>
        <div style={{ display: 'flex', gap: 26 }}>
          <label style={RADIO}>
            <input type="radio" name="fact-cb" checked={!cfg.factureAvecCodeBarre}
              onChange={() => setCfg(prev => ({ ...prev, factureAvecCodeBarre: false }))}
              style={{ accentColor: '#2563EB' }} />
            Sans Code Barre
          </label>
          <label style={RADIO}>
            <input type="radio" name="fact-cb" checked={cfg.factureAvecCodeBarre}
              onChange={() => setCfg(prev => ({ ...prev, factureAvecCodeBarre: true }))}
              style={{ accentColor: '#2563EB' }} />
            Avec Code Barre
          </label>
        </div>
      </fieldset>

      {/* ── NOUVEAU : Calibrage des positions d'impression ────────────────── */}
      <fieldset style={{ ...FS, borderColor: '#93C5FD', background: '#F8FBFF' }}>
        <legend style={{ ...LEG, color: '#1D4ED8', fontWeight: 700 }}>· 🎯 Calibrage des positions d&apos;impression (pré-imprimés) ·</legend>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <select style={{ ...SEL, width: 250 }} value={docCal}
            onChange={e => setDocCal(e.target.value as DocCalibrable)}>
            {DOCS_CALIBRABLES.map(d => <option key={d.cle} value={d.cle}>{d.label}</option>)}
          </select>

          {/* Décalage horizontal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11.5, color: '#374151' }}>Horizontal :</span>
            <button style={STEP} onClick={() => majCalibrage('dx', -0.5)}>◀</button>
            <span style={{
              width: 66, textAlign: 'center', fontSize: 12.5, fontWeight: 700,
              color: cal.dx === 0 ? '#64748B' : '#1D4ED8',
            }}>{cal.dx > 0 ? '+' : ''}{cal.dx.toFixed(1)} mm</span>
            <button style={STEP} onClick={() => majCalibrage('dx', 0.5)}>▶</button>
          </div>

          {/* Décalage vertical */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ fontSize: 11.5, color: '#374151' }}>Vertical :</span>
            <button style={STEP} onClick={() => majCalibrage('dy', -0.5)}>▲</button>
            <span style={{
              width: 66, textAlign: 'center', fontSize: 12.5, fontWeight: 700,
              color: cal.dy === 0 ? '#64748B' : '#1D4ED8',
            }}>{cal.dy > 0 ? '+' : ''}{cal.dy.toFixed(1)} mm</span>
            <button style={STEP} onClick={() => majCalibrage('dy', 0.5)}>▼</button>
          </div>

          <button onClick={() => setCfg(prev => ({
            ...prev, calibrage: { ...prev.calibrage, [docCal]: { dx: 0, dy: 0 } },
          }))} style={{
            height: 28, padding: '0 12px', fontSize: 11.5, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #CBD5E1', background: '#fff', color: '#475569',
          }}>↺ Réinitialiser</button>

          <button onClick={testImpression} style={{
            height: 28, padding: '0 14px', fontSize: 11.5, fontWeight: 700, borderRadius: 4, cursor: 'pointer',
            border: '1px solid #BFDBFE', background: '#EFF6FF', color: '#1D4ED8',
          }}>🖨 Imprimer une page de test</button>
        </div>

        <div style={{ fontSize: 10.5, color: '#64748B', marginTop: 8, lineHeight: 1.5 }}>
          Imprimez la page de test sur le pré-imprimé réel, mesurez le décalage constaté
          (ex. « 2 mm trop bas » → Vertical −2,0 mm), ajustez puis réimprimez.
          Le calibrage est appliqué à toutes les impressions et aperçus de ce document.
        </div>
      </fieldset>

      {/* ── Valider / Fermer ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 12 }}>
        <button onClick={valider} style={{
          height: 32, padding: '0 26px', background: '#16A34A', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Valider ✔</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          height: 32, padding: '0 22px', background: '#DC2626', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Fermer ✕</button>
      </div>
    </div>
  )
}

export default ConfigImprimantesWindow
