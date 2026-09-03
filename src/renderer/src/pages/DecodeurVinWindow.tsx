import { useState, useEffect, useRef } from 'react'
import { decoderVin, zoneVin, nettoyerLibelle, nettoyerCarrosserie, choisirAnnee, type ResultatVin, type Categorie } from '@mock/vinDecoder'
import { electronApi, type VinEnLigne } from '@api/electron'

// ─────────────────────────────────────────────────────────────────────────────
// Fenêtre « Décodage du numéro de châssis (VIN) ».
// Ouverte depuis le bouton à côté du champ Châssis (VIN pré-chargé via
// localStorage tcit_vin_decode) ou depuis le menu Fichier. « Appliquer ce type »
// renseigne le champ « Véhicule à assurer » du formulaire (signal tcit_vin_type).
//
// Le décodage est orchestré en 3 phases VISIBLES et animées (pipeline) :
//   1. Structure   — 17 caractères, jeu de caractères VIN
//   2. Base locale — table WMI hors ligne
//   3. En ligne    — secours NHTSA (si local insuffisant/forcé ET connecté)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  navy: 'var(--tc-heading)', accent: 'var(--accent)', gold: '#F59E0B', green: '#16A34A',
  red: '#DC2626', muted: 'var(--tc-muted)', ink: 'var(--tc-text)', line: 'var(--tc-line)', bg: 'var(--tc-section)',
}
const ZONE_COUL = { wmi: C.accent, vds: C.gold, vis: C.green }
const EMOJI_CAT: Record<Categorie, string> = { Voiture: '🚗', Camion: '🚛', Autre: '🚐' }
const COUL_CONF = { élevée: C.green, moyenne: C.gold, faible: C.muted }

// Statuts d'une étape du pipeline.
type Statut = 'attente' | 'encours' | 'ok' | 'partiel' | 'skip' | 'ko'
interface Etapes { structure: Statut; local: Statut; enligne: Statut }
const ETAPES_VIDE: Etapes = { structure: 'attente', local: 'attente', enligne: 'attente' }

const pause = (ms: number): Promise<void> => new Promise(r => setTimeout(r, ms))

export default function DecodeurVinWindow(): JSX.Element {
  const [vin, setVin] = useState(() => {
    try { return (localStorage.getItem('tcit_vin_decode') ?? '').toUpperCase() } catch { return '' }
  })
  const [res, setRes] = useState<ResultatVin | null>(null)
  const [etapes, setEtapes] = useState<Etapes>(ETAPES_VIDE)
  const [travail, setTravail] = useState(false)          // un décodage est en cours
  const enCoursRef = useRef(false)                        // garde anti double-clic

  // Décode en 3 phases visibles : structure → local → (secours en ligne).
  const decoder = async (forcerEnLigne = false): Promise<void> => {
    if (enCoursRef.current) return
    enCoursRef.current = true
    // On NE vide PAS le résultat précédent : la page reste stable, seul le
    // pipeline (les pastilles) rejoue son animation de phases.
    setTravail(true)
    setEtapes({ structure: 'encours', local: 'attente', enligne: 'attente' })
    try {
      // ── Phase 1 : structure ── (rythme volontairement posé pour voir l'animation)
      await pause(620)
      let local = decoderVin(vin)
      if (!local.structureValide) {
        setEtapes({ structure: 'ko', local: 'attente', enligne: 'attente' })
        setRes(local)
        return
      }
      setEtapes(e => ({ ...e, structure: 'ok', local: 'encours' }))

      // ── Phase 2 : base locale ──
      await pause(760)
      setRes(local)

      // Index appris (Phase 3) : signature VIN → marque/modèle majoritaires +
      // année (règle NA/signature). Consulté ICI, pendant l'étape « local ».
      const idx = await electronApi.vinIndexLookup(local.vin)
      if (idx && idx.marqueModele) {
        const { marque, modele } = nettoyerLibelle(idx.marqueModele)
        const a = choisirAnnee(local.vin, idx.annees)
        local = {
          ...local, modele,
          constructeur: local.constructeur === 'Inconnu' && marque ? marque : local.constructeur,
          annee: a.annee, anneeSource: a.source,
          // `confiance` reste celle de la CATÉGORIE (posée par decoderVin) — la fiabilité
          // du hit d'index est exposée séparément via `confianceModele`.
          confianceModele: idx.part,
          carrosserie: nettoyerCarrosserie(idx.carrosserie ?? ''),
          motorisation: idx.version ?? '—',
          segment: idx.segment ?? '—',
        }
        setRes(local)
      }
      // insuffisant (déclenche NHTSA) = pas de modèle trouvé
      const insuffisant = local.modele === '—' || local.constructeur === 'Inconnu'
      const irEnLigne = (forcerEnLigne || insuffisant) && navigator.onLine
      setEtapes(e => ({
        ...e,
        local: insuffisant ? 'partiel' : 'ok',
        enligne: irEnLigne ? 'encours' : 'skip',
      }))
      if (!irEnLigne) return

      // ── Phase 3 : secours en ligne (NHTSA) ──
      const cle = 'tcit_vin_online_' + local.vin
      try {
        const cache = localStorage.getItem(cle)
        if (cache) { appliquerEnLigne(local, JSON.parse(cache)); setEtapes(e => ({ ...e, enligne: 'ok' })); return }
      } catch { /* cache illisible : on interroge le réseau */ }
      try {
        const online = await electronApi.vinDecodeOnline(local.vin)
        if (online.ok) {
          try { localStorage.setItem(cle, JSON.stringify(online)) } catch { /* ignore */ }
          appliquerEnLigne(local, online)
          setEtapes(e => ({ ...e, enligne: 'ok' }))
        } else {
          setEtapes(e => ({ ...e, enligne: 'ko' }))
        }
      } catch { setEtapes(e => ({ ...e, enligne: 'ko' })) } // réseau : on garde le local
    } finally {
      setTravail(false); enCoursRef.current = false
    }
  }

  function appliquerEnLigne(local: ResultatVin, o: VinEnLigne): void {
    setRes({
      ...local, source: 'en ligne',
      constructeur: o.constructeur || local.constructeur,
      modele: o.modele || local.modele,
      pays: o.pays !== '—' ? o.pays : local.pays,
      annee: o.annee !== '—' ? o.annee : local.annee,
      // Année confirmée en ligne (NHTSA) : ce n'est plus une estimation → plus de « ≈ ».
      anneeSource: o.annee !== '—' ? 'position10' : local.anneeSource,
      categorie: o.categorie ?? local.categorie,
      confiance: o.categorie ? 'élevée' : local.confiance,
      raisonCategorie: o.categorie ? `NHTSA — ${o.typeVehicule || 'type identifié'}` : local.raisonCategorie,
      carrosserie: o.carrosserie ? nettoyerCarrosserie(o.carrosserie) : local.carrosserie,
      motorisation: o.motorisation || local.motorisation,
    })
  }

  useEffect(() => { if (vin.length === 17) void decoder() }, []) // auto-décode si pré-chargé

  const fermer = (): void => { window.dispatchEvent(new CustomEvent('mdi:close-self')) }
  const appliquer = (): void => {
    if (!res?.categorie) return
    localStorage.setItem('tcit_vin_type', JSON.stringify({ type: res.categorie, ts: Date.now() }))
    fermer()
  }

  // Résultat décodé VALIDE (sinon null → on affiche des conteneurs vides « en attente »).
  const dec = res && res.structureValide ? res : null
  const enLigneActif = etapes.enligne === 'encours'
  // Sous-libellé de l'étape « en ligne » selon la situation.
  const sousEnLigne = ((): string => {
    switch (etapes.enligne) {
      case 'encours': return 'NHTSA…'
      case 'ok':      return 'NHTSA ✓'
      case 'ko':      return 'échec'
      case 'skip':    return navigator.onLine ? 'non requis' : 'hors ligne'
      default:        return ''
    }
  })()

  return (
    <div style={{ background: C.bg, minHeight: '100%' }}>
      {/* Sub-header beige */}
      <div style={{ background: 'var(--tc-subheader-bg)', borderBottom: '2px solid var(--tc-subheader-bd)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{ fontSize: 18 }} className={travail ? 'dv-globe' : undefined}>🔎</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, color: C.navy, letterSpacing: 0.6, textTransform: 'uppercase' }}>Décodage du numéro de châssis (VIN)</div>
          <div style={{ fontSize: 10.5, color: C.muted }}>Analyse locale puis secours en ligne — le résultat aide au choix, l'opérateur confirme.</div>
        </div>
      </div>

      <div style={{ padding: '12px 16px' }}>
        {/* Saisie */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: 'var(--tc-label)', whiteSpace: 'nowrap' }}>N° de châssis :</span>
          <input
            className="light-input" value={vin} maxLength={17} disabled={travail}
            onChange={e => setVin(e.target.value.replace(/\s+/g, '').toUpperCase())}
            onKeyDown={e => { if (e.key === 'Enter') void decoder() }}
            placeholder="Ex : WMA06XZZ7CM123456"
            style={{ flex: 1, height: 34, fontFamily: "'Consolas', monospace", fontSize: 16, fontWeight: 700, letterSpacing: 1.5, color: C.navy }}
          />
          <button className="dv-btn dv-btn--primary" disabled={travail || vin.length === 0} onClick={() => void decoder()}>
            {travail ? <span className="dv-ring" /> : <span className="dv-ico">🔍</span>}
            {travail ? 'Décodage…' : 'Décoder'}
          </button>
        </div>

        {/* Pipeline des phases — TOUJOURS visible (état d'attente avant décodage) */}
        <div className={`dv-pipe${travail ? ' is-travail' : ''}`}>
          <Etape icone="structure" label="Structure" sous={etapeSub(etapes.structure)} statut={etapes.structure} />
          <Lien on={etapes.structure === 'ok'} />
          <Etape icone="local" label="Base locale" sous={etapeSub(etapes.local)} statut={etapes.local} />
          <Lien on={etapes.local === 'ok' || etapes.local === 'partiel'} />
          <Etape icone="enligne" label="En ligne" sous={sousEnLigne} statut={etapes.enligne} />
        </div>

        {/* Décomposition — TOUJOURS affichée ; les cases se remplissent à la saisie */}
        <div style={{ background: 'var(--tc-card)', border: `1px solid ${C.line}`, borderRadius: 10, padding: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 9.5, fontWeight: 800, color: C.muted, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 6 }}>Décomposition</div>
          <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {Array.from({ length: 17 }, (_, i) => {
              const ch = vin[i]
              return (
                <div key={i} className="dv-cell" style={ch
                  ? { background: ZONE_COUL[zoneVin(i)] }
                  : { background: 'var(--tc-track)', color: 'var(--tc-subtle)', boxShadow: 'inset 0 0 0 1px var(--tc-line)' }}>
                  <small>{i + 1}</small>
                  {ch ?? ''}
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 7, fontSize: 10.5, color: C.muted, flexWrap: 'wrap' }}>
            <span><b style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.accent, marginRight: 5, verticalAlign: -1 }} />WMI — constructeur / pays (1-3)</span>
            <span><b style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.gold, marginRight: 5, verticalAlign: -1 }} />VDS — description (4-9)</span>
            <span><b style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: C.green, marginRight: 5, verticalAlign: -1 }} />VIS — année / usine / série (10-17)</span>
          </div>
        </div>

        {/* Résultat — TOUJOURS affiché ; valeurs remplies au décodage */}
        <div style={{ background: 'var(--tc-card)', border: `1px solid ${C.line}`, borderRadius: 10, padding: '10px 14px', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: res ? (res.structureValide ? C.green : C.red) : C.muted }}>
            {res ? (res.structureValide ? '✓ Structure VIN valide (17 caractères)' : `✗ ${res.raisonInvalide}`) : 'En attente d’un décodage'}
            {res && (
              <span style={{
                marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
                background: res.source === 'en ligne' ? 'var(--tc-soft-bg)' : 'var(--tc-track)', color: res.source === 'en ligne' ? C.accent : C.muted,
              }}>
                {res.source === 'en ligne'
                  ? <><span className="dv-globe">🌐</span> Source : NHTSA en ligne</>
                  : '💾 Source : base hors ligne'}
              </span>
            )}
          </div>
          {dec && (
            <div style={{ fontSize: 10.5, color: dec.chiffreControleOk ? C.green : (dec.chiffreControleRequis ? C.gold : C.muted), marginBottom: 8 }}>
              {dec.chiffreControleOk ? '● ' : (dec.chiffreControleRequis ? '⚠ ' : 'ℹ ')}{dec.noteControle}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 20px' }}>
            <KV k="Constructeur" v={dec?.constructeur ?? '—'} />
            <KV k="Modèle" v={dec ? (dec.confianceModele != null && dec.confianceModele < 0.7 ? `${dec.modele} (à confirmer)` : dec.modele) : '—'} />
            {dec && dec.carrosserie !== '—' && <KV k="Carrosserie" v={dec.carrosserie} />}
            {dec && dec.motorisation !== '—' && <KV k="Motorisation" v={dec.motorisation} />}
            <KV k="Pays d'origine" v={dec?.pays ?? '—'} />
            <KV k="Année-modèle" v={dec ? (dec.anneeSource === 'signature' ? `≈ ${dec.annee}` : dec.annee) : '—'} />
            <KV k="Code usine" v={dec?.usine ?? '—'} />
            <KV k="N° de série" v={dec ? (dec.serie || '—') : '—'} />
            <KV k="Zone WMI" v={dec?.wmi ?? '—'} />
            {dec && dec.segment !== '—' && <KV k="Segment" v={dec.segment} />}
          </div>
        </div>

        {/* Catégorie suggérée — TOUJOURS affichée */}
        <div className="dv-cat" style={{
          display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, padding: '10px 14px', borderRadius: 12,
          background: dec?.categorie ? 'linear-gradient(135deg,var(--tc-warn-bg),var(--tc-card))' : 'var(--tc-section)',
          border: `1.5px solid ${dec?.categorie ? '#FCD9A0' : C.line}`,
        }}>
          <span className="dv-cat__emoji" style={{ fontSize: 30 }}>{dec?.categorie ? EMOJI_CAT[dec.categorie] : '❓'}</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: dec?.categorie ? C.navy : C.muted, lineHeight: 1 }}>{dec?.categorie ?? (res ? 'À CONFIRMER' : 'À DÉCODER')}</div>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: dec ? COUL_CONF[dec.confiance] : C.muted, marginTop: 3 }}>
              {dec
                ? <><span className="dv-dot-conf" style={{ background: COUL_CONF[dec.confiance] }} />Confiance {dec.confiance}</>
                : '—'}
            </div>
          </div>
          <span style={{ fontSize: 10.5, color: C.muted, flex: 1 }}>{dec?.raisonCategorie ?? 'Saisissez un n° de châssis (17 car.) puis cliquez « Décoder ».'}</span>
          <button className="dv-btn dv-btn--apply" disabled={!dec?.categorie} onClick={appliquer}>
            <span className="dv-ico">✓</span> Appliquer ce type
          </button>
        </div>

        {/* Pied */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="dv-btn dv-btn--online" disabled={travail || vin.length !== 17} onClick={() => void decoder(true)}
            title={navigator.onLine ? 'Forcer le décodage en ligne' : 'Aucune connexion Internet détectée'}
          >
            {enLigneActif ? <span className="dv-ring dv-ring--blue" /> : <span className="dv-ico">🌐</span>}
            {enLigneActif ? 'Interrogation NHTSA…' : 'Décoder en ligne (NHTSA)'}
          </button>
          <button
            className="dv-btn dv-btn--ghost" disabled={vin.length !== 17}
            onClick={() => void electronApi.vinOuvrirConstructeur(vin, res?.constructeur ?? '')}
            title="Ouvrir le site du constructeur (toyodiy pour Toyota, sinon décodeur généraliste)"
          >
            <span className="dv-ico">🔧</span> Fiche constructeur
          </button>
          {!navigator.onLine && <span style={{ fontSize: 10.5, color: C.muted }}>Hors ligne — décodage local seul.</span>}
          <div style={{ flex: 1 }} />
          <button className="dv-btn dv-btn--ghost" disabled={travail} onClick={fermer}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

// Sous-libellé générique d'une étape (structure / local).
function etapeSub(s: Statut): string {
  switch (s) {
    case 'encours': return 'analyse…'
    case 'ok':      return 'ok'
    case 'partiel': return 'insuffisant'
    case 'ko':      return 'invalide'
    default:        return ''
  }
}

type NomPhase = 'structure' | 'local' | 'enligne'

// Icônes de phase — style « Ludique » : loupe qui sautille (structure), fiche qui
// surgit d'un tiroir (base locale), globe avec satellite en orbite (en ligne). Les
// parties animées portent une classe (.dv-mag / .dv-card / .dv-merid / .dv-orbit)
// que le CSS anime tant que le décodage tourne. stroke = couleur du statut.
function IconePhase({ nom }: { nom: NomPhase }): JSX.Element {
  const p = { fill: 'none', stroke: 'currentColor', strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }
  if (nom === 'structure') {
    return (
      <svg viewBox="0 0 24 24" {...p} strokeWidth={2.2}>
        <g className="dv-mag">
          <circle cx="10" cy="10" r="5.6" />
          <line x1="14" y1="14" x2="19" y2="19" strokeWidth={2.4} />
          <line x1="7.6" y1="8.4" x2="10.4" y2="8.4" strokeWidth={1.5} opacity={0.7} />
        </g>
      </svg>
    )
  }
  if (nom === 'local') {
    return (
      <svg viewBox="0 0 24 24" {...p} strokeWidth={2}>
        <g className="dv-card">
          <rect className="dv-occl" x="7.5" y="3.5" width="9" height="9" rx="1.6" />
          <line x1="9.6" y1="7" x2="14.4" y2="7" strokeWidth={1.4} />
          <line x1="9.6" y1="9.4" x2="13" y2="9.4" strokeWidth={1.4} />
        </g>
        <path className="dv-occl" d="M4 13.5 h16 v4.9 a1.6 1.6 0 0 1 -1.6 1.6 h-12.8 a1.6 1.6 0 0 1 -1.6 -1.6 z" />
        <line x1="4" y1="13.5" x2="20" y2="13.5" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 24 24" {...p} strokeWidth={2}>
      <circle cx="12" cy="12" r="6.2" />
      <line x1="5.8" y1="12" x2="18.2" y2="12" strokeWidth={1.4} />
      <ellipse className="dv-merid" cx="12" cy="12" rx="2.9" ry="6.2" strokeWidth={1.4} />
      <g className="dv-orbit"><circle cx="12" cy="3.4" r="1.5" fill="currentColor" stroke="none" /></g>
    </svg>
  )
}

// Marque de validation posée par-dessus (semi-transparente via le CSS).
function MarqueStatut({ statut }: { statut: Statut }): JSX.Element | null {
  if (statut === 'ok') {
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.4} strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12.5 L10 17.5 L19 6.5" />
      </svg>
    )
  }
  if (statut === 'partiel') return <span>⚠</span>
  if (statut === 'ko') return <span>✕</span>
  return null
}

function Etape({ icone, label, sous, statut }: {
  icone: NomPhase; label: string; sous: string; statut: Statut
}): JSX.Element {
  return (
    <div className={`dv-step is-${statut}`}>
      <div className="dv-step__dot">
        <span className="dv-step__icon"><IconePhase nom={icone} /></span>
        <span className="dv-step__mark"><MarqueStatut statut={statut} /></span>
      </div>
      <div className="dv-step__lbl">{label}</div>
      <div className="dv-step__sub">{sous}</div>
    </div>
  )
}

function Lien({ on }: { on: boolean }): JSX.Element {
  return <div className={`dv-link${on ? ' is-on' : ''}`}><div className="dv-link__fill" /></div>
}

function KV({ k, v }: { k: string; v: string }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, borderBottom: '1px dashed #EDF1F8', paddingBottom: 4 }}>
      <span style={{ color: 'var(--tc-muted)' }}>{k}</span>
      <span style={{ fontWeight: 700, color: 'var(--tc-text)' }}>{v}</span>
    </div>
  )
}
