import { useState, useEffect } from 'react'
import { decoderVin, zoneVin, type ResultatVin, type Categorie } from '@mock/vinDecoder'
import { electronApi, type VinEnLigne } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Fenêtre « Décodage du numéro de châssis (VIN) » — hors ligne.
// Ouverte depuis le bouton à côté du champ Châssis (VIN pré-chargé via
// localStorage tcit_vin_decode) ou depuis le menu Fichier. « Appliquer ce type »
// renseigne le champ « Véhicule à assurer » du formulaire (signal tcit_vin_type).
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  navy: '#1B3A6B', accent: '#2563EB', gold: '#F59E0B', green: '#16A34A',
  red: '#DC2626', muted: '#64748B', ink: '#1E293B', line: '#E2E8F0', bg: '#F8FAFF',
}
const ZONE_COUL = { wmi: C.accent, vds: C.gold, vis: C.green }
const EMOJI_CAT: Record<Categorie, string> = { Voiture: '🚗', Camion: '🚛', Autre: '🚐' }
const COUL_CONF = { élevée: C.green, moyenne: C.gold, faible: C.muted }

export default function DecodeurVinWindow(): JSX.Element {
  const [vin, setVin] = useState(() => {
    try { return (localStorage.getItem('tcit_vin_decode') ?? '').toUpperCase() } catch { return '' }
  })
  const [res, setRes] = useState<ResultatVin | null>(null)
  const [chargement, setChargement] = useState(false)   // appel en ligne en cours
  const [enLigneEssaye, setEnLigneEssaye] = useState(false)

  // Décode en local, puis bascule en ligne si nécessaire ET connecté.
  const decoder = async (forcerEnLigne = false): Promise<void> => {
    const local = decoderVin(vin)
    setRes(local); setEnLigneEssaye(false)
    if (!local.structureValide) return
    const insuffisant = local.categorie === null || local.constructeur === 'Inconnu'
    if (!forcerEnLigne && !insuffisant) return
    if (!navigator.onLine) return                        // hors ligne : on garde le local
    // cache
    const cle = 'tcit_vin_online_' + local.vin
    try { const c = localStorage.getItem(cle); if (c) { appliquerEnLigne(local, JSON.parse(c)); return } } catch { /* ignore */ }
    setChargement(true); setEnLigneEssaye(true)
    try {
      const online = await electronApi.vinDecodeOnline(local.vin)
      if (online.ok) { try { localStorage.setItem(cle, JSON.stringify(online)) } catch { /* ignore */ }; appliquerEnLigne(local, online) }
    } catch { /* ignore : on garde le local */ } finally { setChargement(false) }
  }

  function appliquerEnLigne(local: ResultatVin, o: VinEnLigne): void {
    setRes({
      ...local, source: 'en ligne',
      constructeur: o.constructeur || local.constructeur,
      pays: o.pays !== '—' ? o.pays : local.pays,
      annee: o.annee !== '—' ? o.annee : local.annee,
      categorie: o.categorie ?? local.categorie,
      confiance: o.categorie ? 'élevée' : local.confiance,
      raisonCategorie: o.categorie ? `NHTSA — ${o.typeVehicule || 'type identifié'}` : local.raisonCategorie,
    })
  }

  useEffect(() => { if (vin.length === 17) void decoder() }, []) // auto-décode si pré-chargé

  const fermer = (): void => { window.dispatchEvent(new CustomEvent('mdi:close-self')) }
  const appliquer = (): void => {
    if (!res?.categorie) return
    localStorage.setItem('tcit_vin_type', JSON.stringify({ type: res.categorie, ts: Date.now() }))
    fermer()
  }

  const btn: React.CSSProperties = {
    height: 34, padding: '0 16px', border: 'none', borderRadius: 6, fontSize: 12.5,
    fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
  }

  return (
    <div style={{ animation: 'formEnter 0.3s ease', background: C.bg, minHeight: '100%' }}>
      {/* Sub-header beige */}
      <div style={{ background: '#F5F3EE', borderBottom: '2px solid #E2D9C8', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontSize: 18 }}>🔎</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.navy, letterSpacing: 0.6, textTransform: 'uppercase' }}>Décodage du numéro de châssis (VIN)</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>Analyse hors ligne — le résultat aide au choix, l'opérateur confirme.</div>
        </div>
      </div>

      <div style={{ padding: '14px 16px' }}>
        {/* Saisie */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: '#475569', whiteSpace: 'nowrap' }}>N° de châssis :</span>
          <input
            className="light-input" value={vin} maxLength={17}
            onChange={e => setVin(e.target.value.replace(/\s+/g, '').toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') void decoder() }}
            placeholder="Ex : WMA06XZZ7CM123456"
            style={{ flex: 1, height: 34, fontFamily: "'Consolas', monospace", fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: C.navy }}
          />
          <button style={{ ...btn, background: C.accent, color: '#fff' }} onClick={() => void decoder()}>🔍 Décoder</button>
        </div>

        {res && (
          <>
            {/* Décomposition */}
            <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 10, padding: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 9.5, fontWeight: 800, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 8 }}>Décomposition</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {res.vin.split('').map((ch, i) => (
                  <div key={i} style={{
                    width: 30, height: 38, borderRadius: 5, background: ZONE_COUL[zoneVin(i)], color: '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Consolas', monospace", fontWeight: 800, fontSize: 16, position: 'relative',
                  }}>
                    <small style={{ fontSize: 7, opacity: 0.75, position: 'absolute', top: 1 }}>{i + 1}</small>
                    {ch}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 9, fontSize: 10.5, color: C.muted, flexWrap: 'wrap' }}>
                <span><b style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.accent, marginRight: 5, verticalAlign: -1 }} />WMI — constructeur / pays (1-3)</span>
                <span><b style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.gold, marginRight: 5, verticalAlign: -1 }} />VDS — description (4-9)</span>
                <span><b style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.green, marginRight: 5, verticalAlign: -1 }} />VIS — année / usine / série (10-17)</span>
              </div>
            </div>

            {/* Résultat */}
            <div style={{ background: '#fff', border: `1px solid ${C.line}`, borderRadius: 10, padding: '13px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: res.structureValide ? C.green : C.red }}>
                {res.structureValide ? '✓ Structure VIN valide (17 caractères)' : `✗ ${res.raisonInvalide}`}
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                  background: res.source === 'en ligne' ? '#EFF6FF' : '#F1F5F9', color: res.source === 'en ligne' ? C.accent : C.muted,
                }}>
                  {res.source === 'en ligne' ? '🌐 Source : NHTSA en ligne' : '💾 Source : base hors ligne'}
                </span>
              </div>
              {res.structureValide && (
                <div style={{ fontSize: 10.5, color: res.chiffreControleOk ? C.green : (res.chiffreControleRequis ? C.gold : C.muted), marginBottom: 10 }}>
                  {res.chiffreControleOk ? '● ' : (res.chiffreControleRequis ? '⚠ ' : 'ℹ ')}{res.noteControle}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 22px' }}>
                <KV k="Constructeur" v={res.constructeur} />
                <KV k="Pays d'origine" v={res.pays} />
                <KV k="Année-modèle" v={res.annee} />
                <KV k="Code usine" v={res.usine} />
                <KV k="N° de série" v={res.serie || '—'} />
                <KV k="Zone WMI" v={res.wmi} />
              </div>
            </div>

            {chargement && (
              <div style={{ fontSize: 11, color: C.accent, marginBottom: 14 }}>⏳ Recherche en ligne (NHTSA)…</div>
            )}

            {/* Catégorie suggérée */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14, padding: '12px 16px', borderRadius: 12,
              background: res.categorie ? 'linear-gradient(135deg,#FEF9EE,#FFF)' : '#F8FAFC',
              border: `1.5px solid ${res.categorie ? '#FCD9A0' : C.line}`,
            }}>
              <span style={{ fontSize: 34 }}>{res.categorie ? EMOJI_CAT[res.categorie] : '❓'}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: C.navy, lineHeight: 1 }}>{res.categorie ?? 'À CONFIRMER'}</div>
                <div style={{ fontSize: 10.5, fontWeight: 700, color: COUL_CONF[res.confiance], marginTop: 3 }}>● Confiance {res.confiance}</div>
              </div>
              <span style={{ fontSize: 10.5, color: C.muted, flex: 1 }}>{res.raisonCategorie}</span>
              <button
                style={{ ...btn, background: res.categorie ? `linear-gradient(135deg,${C.green},#12813d)` : '#CBD5E1', color: '#fff', cursor: res.categorie ? 'pointer' : 'default' }}
                disabled={!res.categorie} onClick={appliquer}
              >✓ Appliquer ce type</button>
            </div>
          </>
        )}

        {/* Pied */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            style={{ ...btn, background: '#fff', border: `1px solid ${C.accent}`, color: C.accent }}
            disabled={chargement || vin.length !== 17} onClick={() => void decoder(true)}
            title={navigator.onLine ? 'Forcer le décodage en ligne' : 'Aucune connexion Internet détectée'}
          >
            🌐 Décoder en ligne (NHTSA)
          </button>
          {!navigator.onLine && <span style={{ fontSize: 10.5, color: C.muted }}>Hors ligne — décodage local seul.</span>}
          <div style={{ flex: 1 }} />
          <button style={{ ...btn, background: '#fff', border: `1px solid ${C.line}`, color: '#475569' }} onClick={fermer}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

function KV({ k, v }: { k: string; v: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, borderBottom: '1px dashed #EDF1F8', paddingBottom: 5 }}>
      <span style={{ color: '#64748B' }}>{k}</span>
      <span style={{ fontWeight: 700, color: '#1E293B' }}>{v}</span>
    </div>
  )
}
