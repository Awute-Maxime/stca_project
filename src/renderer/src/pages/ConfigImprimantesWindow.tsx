import { useState, useEffect } from 'react'
import { notification } from 'antd'
import { PrinterOutlined } from '@ant-design/icons'
import { electronApi } from '@api/electron'
import { getConfigImpression, setConfigImpression, type ConfigImpression, type DocCalibrable } from '@mock/printConfig'
import { ouvrirApercuDoc } from '@components/documents/editionHelpers'
import { getAllVehicules } from '@mock/vehiculesStore'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION DES ÉDITIONS ET IMPRIMANTES — design « navigation latérale +
// panneau de détail » (maquette B validée le 19/07/2026) :
// - colonne d'icônes à gauche : un document = un item (actif surligné),
// - panneau de détail à droite : imprimante du document (vraies imprimantes du
//   PC + défaut système), options propres au document (code-barres facture,
//   Rouleau/Laser feuillets 1/2, nom d'état Cond. Part., case Fiche ID),
// - CALIBRAGE en pavé directionnel + MINIATURE ANIMÉE : le document se décale
//   en direct (amplifié ×3) pendant le réglage, pas 0,5 mm, page de test.
// Mêmes données persistées que l'ancien design (printConfig.ts).
// ─────────────────────────────────────────────────────────────────────────────

type CleImprimante = keyof ConfigImpression['imprimantes']

interface DocDef {
  cle: CleImprimante
  ico: string
  nom: string
  dims: string
  cal?: DocCalibrable        // absent = pas de calibrage (document non pré-imprimé)
  miniaWMm: number
  miniaHMm: number
  miniaFond: string          // teinte du papier dans la miniature
}

const DOCS: DocDef[] = [
  { cle: 'facture',   ico: '🧾', nom: 'Facture',                  dims: 'A4 — document complet',                     miniaWMm: 210, miniaHMm: 297, miniaFond: '#FFFFFF' },
  { cle: 'cg',        ico: '📇', nom: 'Carte Grise',              dims: '10,5 × 21,2 cm — pré-imprimé',  cal: 'cg',        miniaWMm: 105, miniaHMm: 212, miniaFond: '#FFFFFF' },
  { cle: 'feuillet1', ico: '🔵', nom: 'Feuillet N°1 Bleu',        dims: '28,2 × 7,51 cm — pré-imprimé',  cal: 'feuillet1', miniaWMm: 282, miniaHMm: 75,  miniaFond: '#EAF4FF' },
  { cle: 'feuillet2', ico: '🌸', nom: 'Feuillet N°2 Rose',        dims: '28,2 × 7,51 cm — pré-imprimé',  cal: 'feuillet2', miniaWMm: 282, miniaHMm: 75,  miniaFond: '#FFEDF2' },
  { cle: 'feuillet3', ico: '📄', nom: 'Feuillet N°3 Cond. Part.', dims: 'A4 — pré-imprimé',              cal: 'feuillet3', miniaWMm: 210, miniaHMm: 297, miniaFond: '#FFFFFF' },
  { cle: 'ficheId',   ico: '🟡', nom: 'Fiche ID Véhicule',        dims: '10,5 × 21,2 cm — pré-imprimé',  cal: 'ficheId',   miniaWMm: 105, miniaHMm: 212, miniaFond: '#FFFBD6' },
]

const AMPLI_MINIATURE = 3 // 1 mm de calibrage = 3 px dans la miniature (lisible)

export function ConfigImprimantesWindow(): JSX.Element {
  const [cfg, setCfg] = useState<ConfigImpression>(getConfigImpression)
  const [imprimantes, setImprimantes] = useState<Array<{ name: string; isDefault: boolean }>>([])
  const [actif, setActif] = useState<CleImprimante>('facture')

  const parDefaut = imprimantes.find(p => p.isDefault)?.name ?? ''
  const doc = DOCS.find(d => d.cle === actif) as DocDef
  const cal = doc.cal ? cfg.calibrage[doc.cal] : { dx: 0, dy: 0 }

  // Vraies imprimantes du système ; le défaut système remplit les champs vides
  useEffect(() => {
    void electronApi.printersList().then(liste => {
      setImprimantes(liste)
      const defaut = liste.find(p => p.isDefault)?.name
      if (defaut) {
        setCfg(prev => {
          const impr = { ...prev.imprimantes }
          for (const d of DOCS) if (!impr[d.cle]) impr[d.cle] = defaut
          return { ...prev, imprimantes: impr }
        })
      }
    })
  }, [])

  const majCalibrage = (dx: number, dy: number): void => {
    if (!doc.cal) return
    const cible = doc.cal
    setCfg(prev => ({
      ...prev,
      calibrage: {
        ...prev.calibrage,
        [cible]: {
          dx: Math.round((prev.calibrage[cible].dx + dx) * 2) / 2, // pas de 0,5 mm
          dy: Math.round((prev.calibrage[cible].dy + dy) * 2) / 2,
        },
      },
    }))
  }

  const resetCalibrage = (): void => {
    if (!doc.cal) return
    const cible = doc.cal
    setCfg(prev => ({ ...prev, calibrage: { ...prev.calibrage, [cible]: { dx: 0, dy: 0 } } }))
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
    if (!doc.cal) return
    setConfigImpression(cfg)
    const v = getAllVehicules()[0]
    if (!v) return
    ouvrirApercuDoc(doc.cal, v, false, Date.now())
    notification.info({
      message: '🖨 Page de test ouverte',
      description: 'Lancez l\'impression sur le pré-imprimé réel pour vérifier l\'alignement, puis ajustez le décalage.',
      placement: 'bottomRight',
    })
  }

  // ── Miniature : échelle pour tenir dans la zone d'aperçu ──────────────────
  const scale = Math.min(216 / doc.miniaWMm, 168 / doc.miniaHMm)
  const miniaW = Math.round(doc.miniaWMm * scale)
  const miniaH = Math.round(doc.miniaHMm * scale)

  // ── Styles réutilisés ─────────────────────────────────────────────────────
  const LBL: React.CSSProperties = {
    fontSize: 10, fontWeight: 700, color: '#64748B', textTransform: 'uppercase',
    letterSpacing: 0.6, display: 'block', marginBottom: 6,
  }
  const RADIO: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#1E293B', cursor: 'pointer' }
  const FS: React.CSSProperties = { border: '1px solid #CBD5E1', borderRadius: 8, padding: '8px 14px', marginTop: 14 }
  const LEG: React.CSSProperties = { fontSize: 10, fontWeight: 700, color: '#475569', padding: '0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }

  return (
    <div style={{
      margin: -8, height: 'calc(100vh - 32px)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#fff',
    }}>
      <style>{`
        @keyframes cfgPanEntre { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        .cfgimp-nav-item {
          width: 80px; padding: 9px 4px 7px; border-radius: 10px; border: none;
          background: none; cursor: pointer; text-align: center;
          color: rgba(255,255,255,0.65); position: relative;
          transition: background 0.18s ease, color 0.18s ease;
        }
        .cfgimp-nav-item .nico { font-size: 21px; display: block; margin-bottom: 3px; transition: transform 0.2s ease; }
        .cfgimp-nav-item:hover { background: rgba(255,255,255,0.08); color: #fff; }
        .cfgimp-nav-item:hover .nico { transform: scale(1.15); }
        .cfgimp-nav-item.actif { background: rgba(255,255,255,0.14); color: #fff; }
        .cfgimp-nav-item.actif::before {
          content: ''; position: absolute; left: -8px; top: 22%; bottom: 22%;
          width: 3px; border-radius: 0 3px 3px 0; background: #60A5FA;
        }
        .cfgimp-pave-btn {
          border: 1px solid #CBD5E1; border-radius: 8px; background: #F8FAFF;
          font-size: 14px; color: #1B3A6B; cursor: pointer; font-weight: 700;
          transition: background 0.12s ease, transform 0.1s ease;
        }
        .cfgimp-pave-btn:hover { background: #EFF6FF; }
        .cfgimp-pave-btn:active { transform: scale(0.92); background: #DBEAFE; }
        .cfgimp-btn-test {
          height: 32px; padding: 0 16px; border-radius: 8px; cursor: pointer;
          border: 1px solid #BFDBFE; background: #EFF6FF; color: #1D4ED8;
          font-size: 11.5px; font-weight: 700;
          transition: transform 0.12s ease, box-shadow 0.15s ease;
        }
        .cfgimp-btn-test:hover { transform: translateY(-1px); box-shadow: 0 6px 14px rgba(37,99,235,0.18); }
        .cfgimp-select {
          width: 100%; height: 30px; border: 1px solid #CBD5E1; border-radius: 7px;
          padding: 0 10px; font-size: 12px; background: #fff; color: #1E293B;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .cfgimp-select:focus { border-color: #2563EB; box-shadow: 0 0 0 3px rgba(37,99,235,0.12); outline: none; }
      `}</style>

      {/* ── Bandeau beige (modèle Enregistrement) ─────────────────────────── */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8', flexShrink: 0,
        padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 8,
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

      {/* ── Corps : navigation latérale + panneau de détail ───────────────── */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>

        {/* Navigation latérale */}
        <div style={{
          width: 98, flexShrink: 0, overflowY: 'auto',
          background: 'linear-gradient(180deg, #1E4080, #112654)',
          padding: '12px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        }}>
          {DOCS.map(d => (
            <button key={d.cle}
              className={`cfgimp-nav-item${d.cle === actif ? ' actif' : ''}`}
              onClick={() => setActif(d.cle)}>
              <span className="nico">{d.ico}</span>
              <span style={{ fontSize: 8.5, fontWeight: 600, lineHeight: 1.2, display: 'block' }}>{d.nom}</span>
            </button>
          ))}
        </div>

        {/* Panneau de détail (ré-animé à chaque changement de document) */}
        <div key={actif} style={{ flex: 1, minWidth: 0, overflowY: 'auto', padding: '16px 22px', animation: 'cfgPanEntre 0.25s ease' }}>

          {/* En-tête du document */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{
              width: 46, height: 46, borderRadius: 12, fontSize: 24, flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: '#EFF6FF', border: '1px solid #BFDBFE',
            }}>{doc.ico}</div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#1B3A6B' }}>{doc.nom}</div>
              <div style={{ fontSize: 11, color: '#64748B' }}>{doc.dims}</div>
            </div>
          </div>

          {/* Imprimante du document */}
          <div style={{ marginBottom: 4, maxWidth: 430 }}>
            <span style={LBL}>Imprimante pour ce document</span>
            <select className="cfgimp-select" value={cfg.imprimantes[doc.cle]}
              onChange={e => setCfg(prev => ({ ...prev, imprimantes: { ...prev.imprimantes, [doc.cle]: e.target.value } }))}>
              {imprimantes.length === 0 && <option value="">— aucune imprimante détectée —</option>}
              {imprimantes.map(p => (
                <option key={p.name} value={p.name}>
                  {p.name}{p.isDefault ? '   (par défaut du système)' : ''}
                </option>
              ))}
            </select>
            {cfg.imprimantes[doc.cle] !== '' && cfg.imprimantes[doc.cle] === parDefaut && (
              <span style={{ fontSize: 10, color: '#16A34A', fontWeight: 600, marginTop: 4, display: 'inline-block' }}>
                ✓ Imprimante par défaut du système
              </span>
            )}
          </div>

          {/* Options propres au document */}
          {doc.cle === 'facture' && (
            <fieldset style={{ ...FS, maxWidth: 430 }}>
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
          )}

          {(doc.cle === 'feuillet1' || doc.cle === 'feuillet2') && (
            <fieldset style={{ ...FS, maxWidth: 430 }}>
              <legend style={LEG}>· Type Imprimante Feuillets Assurance N° 1/2 ·</legend>
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

          {doc.cle === 'feuillet3' && (
            <div style={{ ...FS, maxWidth: 430, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1B3A6B', whiteSpace: 'nowrap' }}>Nom Etat Cond. Part. :</span>
              <input className="light-input" value={cfg.nomEtatCondPart}
                onChange={e => setCfg(prev => ({ ...prev, nomEtatCondPart: e.target.value }))}
                style={{ flex: 1, height: 26, fontWeight: 600, color: '#1D4ED8' }} />
              <button title="Nom du modèle d'état utilisé pour le Feuillet N°3" style={{
                width: 26, height: 26, border: '1px solid #CBD5E1', borderRadius: 4, flexShrink: 0,
                background: '#F8FAFF', color: '#1B3A6B', fontWeight: 700, cursor: 'help',
              }}>?</button>
            </div>
          )}

          {doc.cle === 'ficheId' && (
            <label style={{ ...RADIO, fontWeight: 700, color: '#1D4ED8', marginTop: 14 }}>
              <input type="checkbox" checked={cfg.imprimerFicheId}
                onChange={e => setCfg(prev => ({ ...prev, imprimerFicheId: e.target.checked }))}
                style={{ accentColor: '#2563EB' }} />
              Imprimer Fiche ID Véhicule
            </label>
          )}

          {/* Calibrage + miniature animée (documents pré-imprimés uniquement) */}
          {doc.cal ? (
            <div style={{ display: 'flex', gap: 24, marginTop: 18, flexWrap: 'wrap' }}>

              {/* Pavé directionnel */}
              <div>
                <span style={LBL}>Calibrage de la position (mm)</span>
                <div style={{
                  display: 'grid', gridTemplateColumns: '34px 34px 34px', gridTemplateRows: '34px 34px 34px',
                  gap: 5, justifyContent: 'start',
                }}>
                  <span />
                  <button className="cfgimp-pave-btn" title="Monter de 0,5 mm" onClick={() => majCalibrage(0, -0.5)}>▲</button>
                  <span />
                  <button className="cfgimp-pave-btn" title="Vers la gauche de 0,5 mm" onClick={() => majCalibrage(-0.5, 0)}>◀</button>
                  <button onClick={resetCalibrage} title="Réinitialiser (0,0)" style={{
                    fontSize: 12, fontWeight: 700, color: '#1D4ED8', border: '1px dashed #BFDBFE',
                    borderRadius: 8, background: '#fff', cursor: 'pointer',
                  }}>↺</button>
                  <button className="cfgimp-pave-btn" title="Vers la droite de 0,5 mm" onClick={() => majCalibrage(0.5, 0)}>▶</button>
                  <span />
                  <button className="cfgimp-pave-btn" title="Descendre de 0,5 mm" onClick={() => majCalibrage(0, 0.5)}>▼</button>
                  <span />
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8, color: cal.dx === 0 && cal.dy === 0 ? '#64748B' : '#1D4ED8' }}>
                  Horizontal : {cal.dx > 0 ? '+' : ''}{cal.dx.toFixed(1).replace('.', ',')} mm
                  &nbsp;·&nbsp; Vertical : {cal.dy > 0 ? '+' : ''}{cal.dy.toFixed(1).replace('.', ',')} mm
                </div>
                <button className="cfgimp-btn-test" style={{ marginTop: 12 }} onClick={testImpression}>
                  🖨 Imprimer une page de test
                </button>
                <div style={{ fontSize: 10, color: '#64748B', marginTop: 10, lineHeight: 1.5, maxWidth: 240 }}>
                  Imprimez la page de test sur le pré-imprimé réel, mesurez le décalage constaté
                  (ex. « 2 mm trop bas » → ▲ jusqu&apos;à −2,0 mm), puis réimprimez.
                </div>
              </div>

              {/* Miniature animée : le document se décale en direct */}
              <div style={{
                width: 252, height: 204, flexShrink: 0, background: '#64748B', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden',
              }}>
                <span style={{
                  position: 'absolute', top: 7, right: 9, fontSize: 8, fontWeight: 800,
                  letterSpacing: 1, color: 'rgba(255,255,255,0.5)',
                }}>APERÇU LIVE ×{AMPLI_MINIATURE}</span>
                {/* Cadre = position idéale sur le pré-imprimé */}
                <div style={{
                  width: miniaW, height: miniaH, position: 'relative', borderRadius: 3,
                  background: 'rgba(255,255,255,0.14)', border: '1.5px dashed rgba(255,255,255,0.45)',
                }}>
                  {/* Le document, décalé du calibrage (amplifié pour être visible) */}
                  <div style={{
                    position: 'absolute', inset: 0, background: doc.miniaFond, borderRadius: 2,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.35)', padding: '10%  8%',
                    transform: `translate(${cal.dx * AMPLI_MINIATURE}px, ${cal.dy * AMPLI_MINIATURE}px)`,
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    display: 'flex', flexDirection: 'column', gap: '7%',
                  }}>
                    <div style={{ height: 5, borderRadius: 2, background: '#1B3A6B', width: '70%' }} />
                    <div style={{ height: 4, borderRadius: 2, background: '#CBD5E1', width: '55%' }} />
                    <div style={{ height: 4, borderRadius: 2, background: '#CBD5E1', width: '85%' }} />
                    <div style={{ height: 4, borderRadius: 2, background: '#CBD5E1', width: '40%' }} />
                    <div style={{ height: 4, borderRadius: 2, background: '#CBD5E1', width: '60%' }} />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              marginTop: 18, maxWidth: 430, padding: '10px 14px', borderRadius: 8,
              background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 11, color: '#64748B', lineHeight: 1.5,
            }}>
              ℹ La facture est imprimée en entier sur papier A4 vierge :
              aucun calibrage de position n&apos;est nécessaire pour ce document.
            </div>
          )}
        </div>
      </div>

      {/* ── Pied : Valider / Fermer ───────────────────────────────────────── */}
      <div style={{
        flexShrink: 0, display: 'flex', justifyContent: 'center', gap: 12,
        padding: '10px 0', borderTop: '1px solid #E2E8F0', background: '#F8FAFF',
      }}>
        <button onClick={valider} style={{
          height: 32, padding: '0 26px', background: '#16A34A', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Valider ✔</button>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          height: 32, padding: '0 22px', background: '#DC2626', color: '#fff',
          border: 'none', borderRadius: 6, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Fermer ✕</button>
      </div>
    </div>
  )
}

export default ConfigImprimantesWindow
