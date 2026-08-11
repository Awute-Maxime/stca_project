import { useEffect, useState, type CSSProperties } from 'react'
import { electronApi } from '@api/electron'
import { fusionnerBranding, resoudreTheme, type BrandingConfig, type ThemeChoix } from '../../../shared/branding'
import { prefereSombreOS } from '@theme/appliquerBranding'

// ─────────────────────────────────────────────────────────────────────────────
// PERSONNALISATION DE L'APPLICATION — panneau split (réglages 3 onglets | aperçu
// live). Reproduction fidèle de prototype-html/personnalisation-propositions.html
// (SANS la barre de titre / menu / statut : fournis par MdiWindowHost).
//
// Aperçu SCOPÉ : les couleurs du brouillon (accent + clair/sombre) sont posées en
// INLINE sur le conteneur d'aperçu (variables CSS). On n'écrit JAMAIS sur
// document.documentElement → l'app ne change qu'au clic « Appliquer ».
// ─────────────────────────────────────────────────────────────────────────────

type Onglet = 'identite' | 'apparence' | 'documents'
type VueApercu = 'login' | 'app' | 'doc'
const PRESETS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#DC2626', '#0891B2'] as const

// Étoile TCIT (SVG) — teintée var(--accent) par défaut ; remplacée par le logo si présent.
function StarLogo(): JSX.Element {
  return (
    <svg viewBox="0 0 56 56" width="100%" height="100%" aria-hidden>
      <polygon
        points="28,2 33.8,18.4 51.8,18.4 37.4,28.4 43.2,44.8 28,34.8 12.8,44.8 18.6,28.4 4.2,18.4 22.2,18.4"
        fill="var(--accent)"
      />
    </svg>
  )
}
function Logo({ src }: { src: string | null }): JSX.Element {
  return src ? <img src={src} alt="logo" /> : <StarLogo />
}

export default function PersonnalisationWindow(): JSX.Element {
  const [draft, setDraft] = useState<BrandingConfig>(() => fusionnerBranding({}))
  const [onglet, setOnglet] = useState<Onglet>('identite')
  const [vue, setVue] = useState<VueApercu>('login')
  const [toast, setToast] = useState(false)

  useEffect(() => { electronApi.brandingCourant().then(setDraft) }, [])

  // Mises à jour immuables du brouillon
  const majIdentite = (p: Partial<BrandingConfig['identite']>): void =>
    setDraft(d => ({ ...d, identite: { ...d.identite, ...p } }))
  const majCoord = (p: Partial<BrandingConfig['identite']['coordonnees']>): void =>
    setDraft(d => ({ ...d, identite: { ...d.identite, coordonnees: { ...d.identite.coordonnees, ...p } } }))
  const majApparence = (p: Partial<BrandingConfig['apparence']>): void =>
    setDraft(d => ({ ...d, apparence: { ...d.apparence, ...p } }))
  const majDocuments = (p: Partial<BrandingConfig['documents']>): void =>
    setDraft(d => ({ ...d, documents: { ...d.documents, ...p } }))

  const onLogo = (file: File | undefined): void => {
    if (!file) return
    const r = new FileReader()
    r.onload = e => majIdentite({ logo: String(e.target?.result ?? '') })
    r.readAsDataURL(file)
  }

  const appliquer = (): void => {
    void electronApi.brandingEcrire(draft).then(() => { setToast(true); setTimeout(() => setToast(false), 1800) })
  }
  const reinitialiser = (): void => setDraft(fusionnerBranding({})) // défauts TCIT (persistés seulement à Appliquer)

  // Aperçu scopé au panneau (ne touche PAS <html> avant Appliquer)
  const apercuSombre = resoudreTheme(draft.apparence.theme, prefereSombreOS()) === 'sombre'
  const accent = draft.apparence.couleurAccent
  const estPreset = PRESETS.some(p => p.toLowerCase() === accent.toLowerCase())

  const id = draft.identite
  const co = id.coordonnees
  const doc = draft.documents
  const sigle = id.sigle || 'TCIT'

  // Variables CSS du brouillon posées INLINE sur le conteneur d'aperçu (jamais sur <html>).
  const styleApercu: CSSProperties = apercuSombre
    ? {
        ['--accent' as never]: accent,
        ['--accent-tx' as never]: '#fff',
        ['--desktop' as never]: '#05080D',
        ['--dot' as never]: 'rgba(120,150,190,.055)',
        ['--chrome1' as never]: '#0E1626',
        ['--chrome2' as never]: '#0A1018',
        ['--surface' as never]: '#111826',
        ['--surface2' as never]: '#0D1420',
        ['--border' as never]: 'rgba(255,255,255,.08)',
        ['--border-soft' as never]: 'rgba(255,255,255,.05)',
        ['--text' as never]: '#E9EEF6',
        ['--muted' as never]: '#93A1B5',
        ['--subtle' as never]: '#5F6E82',
        ['--field-bg' as never]: '#0B111C',
        ['--field-bd' as never]: 'rgba(255,255,255,.10)',
        ['--glow' as never]: '0 0 18px color-mix(in srgb,var(--accent) 55%,transparent)',
      }
    : { ['--accent' as never]: accent }

  const tab = (o: Onglet, label: string, path: JSX.Element): JSX.Element => (
    <button className={`pw-tab${onglet === o ? ' pw-on' : ''}`} onClick={() => setOnglet(o)} type="button">
      {path}{label}
    </button>
  )

  return (
    <div className="pw-root" style={{ ['--accent' as never]: accent }}>
      <style>{CSS}</style>

      <div className="pw-split">
        {/* ============ RÉGLAGES ============ */}
        <div className="pw-pane">
          <div className="pw-tabs">
            {tab('identite', 'Identité',
              <svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 4-6 8-6s8 2 8 6" /></svg>)}
            {tab('apparence', 'Apparence',
              <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" /></svg>)}
            {tab('documents', 'Documents',
              <svg viewBox="0 0 24 24"><path d="M6 2h9l5 5v15H6z" /><path d="M15 2v5h5M9 13h6M9 17h6" /></svg>)}
          </div>

          <div className="pw-tabbody">

            {/* IDENTITÉ */}
            {onglet === 'identite' && (
              <div className="pw-panel pw-on">
                <div className="pw-sec">Logo &amp; identité</div>
                <label className="pw-drop">
                  <span className="pw-lgprev"><Logo src={id.logo} /></span>
                  <span className="pw-dt"><b>Déposer le logo</b><span>PNG/SVG transparent · cliquez pour choisir</span></span>
                  <input type="file" accept="image/*" hidden onChange={e => onLogo(e.target.files?.[0])} />
                </label>
                <div style={{ height: 14 }} />
                <div className="pw-fld"><label>Nom / raison sociale</label>
                  <input className="pw-inp" value={id.nom} onChange={e => majIdentite({ nom: e.target.value })} /></div>
                <div className="pw-row2">
                  <div className="pw-fld"><label>Sigle</label>
                    <input className="pw-inp" value={id.sigle} onChange={e => majIdentite({ sigle: e.target.value })} /></div>
                  <div className="pw-fld"><label>Slogan</label>
                    <input className="pw-inp" value={id.slogan} onChange={e => majIdentite({ slogan: e.target.value })} /></div>
                </div>
                <div className="pw-sec" style={{ marginTop: 16 }}>Coordonnées</div>
                <div className="pw-fld"><label>Adresse</label>
                  <input className="pw-inp" value={co.adresse} placeholder="Port de Lomé, Zone Franche — Togo"
                    onChange={e => majCoord({ adresse: e.target.value })} /></div>
                <div className="pw-row2">
                  <div className="pw-fld"><label>Téléphone</label>
                    <input className="pw-inp" value={co.tel} placeholder="+228 22 00 00 00"
                      onChange={e => majCoord({ tel: e.target.value })} /></div>
                  <div className="pw-fld"><label>E-mail</label>
                    <input className="pw-inp" value={co.email} placeholder="contact@tcit.tg"
                      onChange={e => majCoord({ email: e.target.value })} /></div>
                </div>
                <div className="pw-row2">
                  <div className="pw-fld"><label>NIF</label>
                    <input className="pw-inp" value={co.nif} placeholder="1000123456"
                      onChange={e => majCoord({ nif: e.target.value })} /></div>
                  <div className="pw-fld"><label>RCCM</label>
                    <input className="pw-inp" value={co.rccm} placeholder="TG-LOM-2020-B-1234"
                      onChange={e => majCoord({ rccm: e.target.value })} /></div>
                </div>
              </div>
            )}

            {/* APPARENCE */}
            {onglet === 'apparence' && (
              <div className="pw-panel pw-on">
                <div className="pw-sec">Thème</div>
                <div className="pw-seg">
                  {([
                    ['clair', 'Clair', <svg key="c" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4" /></svg>],
                    ['sombre', 'Sombre', <svg key="s" viewBox="0 0 24 24"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>],
                    ['auto', 'Auto', <svg key="a" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>],
                  ] as [ThemeChoix, string, JSX.Element][]).map(([val, label, ico]) => (
                    <button key={val} type="button"
                      className={draft.apparence.theme === val ? 'pw-on' : undefined}
                      onClick={() => majApparence({ theme: val })}>{ico}{label}</button>
                  ))}
                </div>
                <div className="pw-swlabel">« Auto » suit le thème du système d'exploitation.</div>

                <div className="pw-sec" style={{ marginTop: 18 }}>Couleur d'accent</div>
                <div className="pw-swatches">
                  {PRESETS.map(c => (
                    <div key={c} title={c}
                      className={`pw-sw${accent.toLowerCase() === c.toLowerCase() ? ' pw-on' : ''}`}
                      style={{ ['--c' as never]: c, background: c }}
                      onClick={() => majApparence({ couleurAccent: c })} />
                  ))}
                  <label className={`pw-sw pw-custom${!estPreset ? ' pw-on' : ''}`} title="Couleur personnalisée">
                    <input type="color" value={accent}
                      onChange={e => majApparence({ couleurAccent: e.target.value })} />
                  </label>
                </div>
                <div className="pw-swlabel">Bleu TCIT par défaut · <b>Émeraude</b> = preset inspiré de ta capture.
                  Le fond sombre reste identique ; seule la couleur qui rayonne change.</div>
              </div>
            )}

            {/* DOCUMENTS */}
            {onglet === 'documents' && (
              <div className="pw-panel pw-on">
                <div className="pw-sec">En-tête / pied des documents imprimés</div>
                <div className="pw-fld"><label>Ligne d'en-tête</label>
                  <input className="pw-inp" value={doc.enTete} placeholder="RÉPUBLIQUE TOGOLAISE — Immatriculation en transit"
                    onChange={e => majDocuments({ enTete: e.target.value })} /></div>
                <div className="pw-fld"><label>Mentions légales (pied)</label>
                  <textarea className="pw-inp" value={doc.mentionsLegales}
                    placeholder="Document officiel TCIT. Toute reproduction est interdite."
                    onChange={e => majDocuments({ mentionsLegales: e.target.value })} /></div>
                <div className="pw-row2">
                  <div className="pw-fld"><label>N° d'agrément</label>
                    <input className="pw-inp" value={doc.numeroAgrement} placeholder="AGR-2020-0457"
                      onChange={e => majDocuments({ numeroAgrement: e.target.value })} /></div>
                  <div className="pw-fld"><label>Devise</label>
                    <input className="pw-inp" value={doc.devise}
                      onChange={e => majDocuments({ devise: e.target.value })} /></div>
                </div>
                <div className="pw-fld"><label>Coordonnées bancaires (factures)</label>
                  <input className="pw-inp" value={doc.coordonneesBancaires} placeholder="Ecobank Togo · TG00 5000 1234 5678"
                    onChange={e => majDocuments({ coordonneesBancaires: e.target.value })} /></div>
                <div className="pw-swlabel">Le logo &amp; les coordonnées de l'onglet « Identité » alimentent
                  aussi l'en-tête des documents.</div>
              </div>
            )}

          </div>
        </div>

        {/* ============ APERÇU LIVE (scopé) ============ */}
        <div className="pw-preview" style={styleApercu}>
          <div className="pw-pv-head">
            <span className="pw-lab">Aperçu en direct</span>
            <div className="pw-pvseg">
              {([['login', 'Connexion'], ['app', 'Application'], ['doc', 'Document']] as [VueApercu, string][]).map(([v, l]) => (
                <button key={v} type="button" className={vue === v ? 'pw-on' : undefined}
                  onClick={() => setVue(v)}>{l}</button>
              ))}
            </div>
          </div>
          <div className="pw-pv-body">

            {/* Connexion */}
            {vue === 'login' && (
              <div className="pw-pv pw-on">
                <div className="pw-mini-login">
                  <div className="pw-ml-hd">
                    <span className="pw-ml-logo"><Logo src={id.logo} /></span>
                    <div><div className="pw-ml-t">{sigle}</div><div className="pw-ml-s">{id.slogan}</div></div>
                  </div>
                  <div className="pw-ml-bd">
                    <div className="pw-mlab">Utilisateur</div><div className="pw-mfield">awute</div>
                    <div className="pw-mlab">Mot de passe</div><div className="pw-mfield">••••••••</div>
                    <button className="pw-ml-btn" type="button">Se connecter</button>
                  </div>
                  <div className="pw-ml-strip"><i /><i /><i /></div>
                </div>
              </div>
            )}

            {/* Application */}
            {vue === 'app' && (
              <div className="pw-pv pw-on">
                <div className="pw-mini-app">
                  <div className="pw-ma-tb"><span className="pw-ma-star"><StarLogo /></span><b>{sigle}</b></div>
                  <div className="pw-ma-body">
                    <div className="pw-ma-sb">
                      <span className="pw-ma-lg"><Logo src={id.logo} /></span>
                      <div className="pw-nb">≡</div><div className="pw-nb">◷</div><div className="pw-nb">⚲</div>
                      <div className="pw-nb pw-ac" style={{ marginTop: 'auto' }} title="Paramètres de l'application">⚙</div>
                    </div>
                    <div className="pw-ma-main">
                      <div className="pw-ma-card"><div className="pw-h">Enregistrement</div>
                        <div className="pw-ma-badge">TG 4821 A</div>
                        <div style={{ height: 8 }} /><div className="pw-ma-line" /><div className="pw-ma-line pw-s" /></div>
                      <div className="pw-ma-card"><div className="pw-h">Destination</div>
                        <div className="pw-ma-line" /><div className="pw-ma-line pw-s" /></div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document */}
            {vue === 'doc' && (
              <div className="pw-pv pw-on">
                <div className="pw-mini-doc">
                  <div className="pw-md-hd">
                    <span className="pw-md-logo"><Logo src={id.logo} /></span>
                    <div className="pw-md-co"><b>{sigle}</b><span>{co.adresse || 'Port de Lomé, Zone Franche — Togo'}</span></div>
                    <div className="pw-md-ti"><b>CARTE GRISE</b><span>N° TG-4821-A</span></div>
                  </div>
                  <div className="pw-md-rows">
                    <div className="pw-r"><div className="pw-k">Immatriculation</div><div className="pw-v">TG 4821 A</div></div>
                    <div className="pw-r"><div className="pw-k">Marque / Modèle</div><div className="pw-v">Toyota Hilux</div></div>
                    <div className="pw-r"><div className="pw-k">N° châssis (VIN)</div><div className="pw-v">AHTFR22G50123456</div></div>
                    <div className="pw-r"><div className="pw-k">Montant perçu</div>
                      <div className="pw-v"><span className="pw-md-devise">125 000 {doc.devise || 'FCFA'}</span></div></div>
                  </div>
                  <div className="pw-md-ft">
                    <div style={{ maxWidth: '60%' }}>
                      <b>{doc.enTete || 'RÉPUBLIQUE TOGOLAISE'}</b><br />
                      <span>{doc.mentionsLegales || 'Document officiel TCIT.'}</span><br />
                      Agrément : <span>{doc.numeroAgrement || 'AGR-2020-0457'}</span>
                    </div>
                    <div className="pw-stamp">CACHET<br />{sigle}</div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Pied */}
      <div className="pw-ft">
        <span className="pw-hint">💡 Ces réglages sont partagés par les 3 apps (TCIT · Affichage · Pointage)
          via <code>branding.json</code>.</span>
        <button className="pw-btn pw-ghost" type="button" onClick={reinitialiser}>Réinitialiser</button>
        <button className="pw-btn pw-primary" type="button" onClick={appliquer}>Appliquer</button>
      </div>

      {toast && <div className="pw-toast pw-show">✓ Personnalisation appliquée</div>}
    </div>
  )
}

// ─── Styles scopés (classes préfixées pw-*) — reprennent les valeurs de la maquette ───
const CSS = `
.pw-root{
  --accent-tx:#fff; --desktop:#F0F2F5; --dot:rgba(100,116,139,.10);
  --chrome1:#1E3F72; --chrome2:#1B3A6B;
  --surface:#fff; --surface2:#F8FAFF; --border:#E2E8F0; --border-soft:#F1F5F9;
  --text:#0F172A; --muted:#64748B; --subtle:#94A3B8;
  --field-bg:#F8FAFC; --field-bd:rgba(15,23,42,.14); --glow:none;
  --dur:200ms; --ease:cubic-bezier(.4,0,.2,1);
  display:flex; flex-direction:column; height:100%;
  font-family:'Inter',system-ui,sans-serif; font-size:13px; line-height:1.45;
  background:var(--surface); color:var(--text);
}
.pw-root *,.pw-root *::before,.pw-root *::after{box-sizing:border-box}
.pw-root button{font-family:inherit}

.pw-split{flex:1;display:grid;grid-template-columns:minmax(340px,1fr) minmax(340px,1.05fr);min-height:0}
@media(max-width:820px){.pw-split{grid-template-columns:1fr}}

/* ── Colonne réglages ── */
.pw-pane{display:flex;flex-direction:column;min-height:0;border-right:1px solid var(--border)}
.pw-tabs{display:flex;gap:2px;padding:12px 14px 0;flex-shrink:0}
.pw-tab{flex:1;padding:9px 8px;border:none;background:transparent;cursor:pointer;border-radius:8px 8px 0 0;
  font:600 11.5px 'Inter';color:var(--muted);display:flex;align-items:center;justify-content:center;gap:6px;
  border-bottom:2px solid transparent;transition:all var(--dur)}
.pw-tab:hover{color:var(--text);background:var(--surface2)}
.pw-tab.pw-on{color:var(--accent);border-bottom-color:var(--accent)}
.pw-tab svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8}
.pw-tabbody{flex:1;overflow:auto;padding:16px 18px 8px}
.pw-panel{animation:pw-fadeUp .28s var(--ease)}
@keyframes pw-fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}

.pw-sec{font:800 10px 'Inter';color:var(--accent);text-transform:uppercase;letter-spacing:.8px;
  margin:6px 0 12px;padding-left:9px;border-left:3px solid var(--accent)}
.pw-fld{margin-bottom:13px}
.pw-fld label{display:block;font:700 10px 'Inter';color:var(--muted);text-transform:uppercase;
  letter-spacing:.06em;margin-bottom:5px}
.pw-inp{width:100%;height:36px;padding:0 12px;border:1.5px solid var(--field-bd);border-radius:8px;
  background:var(--field-bg);color:var(--text);font:400 13px 'Inter';outline:none;
  transition:border-color var(--dur),box-shadow var(--dur),background var(--dur)}
textarea.pw-inp{height:auto;padding:9px 12px;resize:vertical;min-height:58px;line-height:1.4}
.pw-inp:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 18%,transparent)}
.pw-inp::placeholder{color:var(--subtle)}
.pw-row2{display:grid;grid-template-columns:1fr 1fr;gap:10px}

.pw-drop{border:2px dashed var(--field-bd);border-radius:10px;padding:16px;text-align:center;cursor:pointer;
  display:flex;align-items:center;gap:14px;background:var(--surface2);transition:all var(--dur)}
.pw-drop:hover{border-color:var(--accent);background:color-mix(in srgb,var(--accent) 7%,var(--surface2))}
.pw-lgprev{width:56px;height:56px;border-radius:12px;flex-shrink:0;display:flex;align-items:center;justify-content:center;
  background:color-mix(in srgb,var(--accent) 14%,transparent);overflow:hidden}
.pw-lgprev img{width:100%;height:100%;object-fit:contain}
.pw-lgprev svg{width:30px;height:30px}
.pw-dt{text-align:left}
.pw-dt b{display:block;font-size:12px;color:var(--text)}
.pw-dt span{font-size:10.5px;color:var(--subtle)}

.pw-seg{display:flex;background:var(--field-bg);border:1.5px solid var(--field-bd);border-radius:9px;padding:3px;gap:3px}
.pw-seg button{flex:1;padding:8px 6px;border:none;background:transparent;border-radius:6px;cursor:pointer;
  font:600 11.5px 'Inter';color:var(--muted);display:flex;align-items:center;justify-content:center;gap:6px;
  transition:all var(--dur)}
.pw-seg button svg{width:15px;height:15px;stroke:currentColor;fill:none;stroke-width:1.8}
.pw-seg button:hover{color:var(--text)}
.pw-seg button.pw-on{background:var(--surface);color:var(--accent);box-shadow:0 1px 4px rgba(0,0,0,.12)}

.pw-swatches{display:flex;flex-wrap:wrap;gap:10px;margin-top:4px}
.pw-sw{width:36px;height:36px;border-radius:10px;cursor:pointer;position:relative;border:2px solid transparent;
  transition:transform var(--dur),box-shadow var(--dur)}
.pw-sw:hover{transform:translateY(-2px) scale(1.05)}
.pw-sw.pw-on{border-color:var(--surface);box-shadow:0 0 0 2px var(--c),0 4px 12px color-mix(in srgb,var(--c) 45%,transparent)}
.pw-sw.pw-on::after{content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  color:#fff;font-size:15px;font-weight:800;text-shadow:0 1px 2px rgba(0,0,0,.4)}
.pw-sw.pw-custom{background:conic-gradient(from 0deg,#ef4444,#f59e0b,#22c55e,#0891b2,#2563EB,#7c3aed,#ef4444);
  display:flex;align-items:center;justify-content:center;overflow:hidden}
.pw-sw.pw-custom.pw-on{--c:#94A3B8}
.pw-sw.pw-custom input{opacity:0;width:100%;height:100%;cursor:pointer;border:none;padding:0;background:none}
.pw-swlabel{font-size:10px;color:var(--subtle);margin-top:9px}

/* ── Colonne aperçu ── */
.pw-preview{display:flex;flex-direction:column;min-height:0;background:var(--surface2);
  transition:background var(--dur) var(--ease),color var(--dur);color:var(--text)}
.pw-pv-head{display:flex;align-items:center;gap:8px;padding:12px 16px;flex-shrink:0}
.pw-lab{font:800 10px 'Inter';text-transform:uppercase;letter-spacing:.8px;color:var(--muted);flex:1}
.pw-pvseg{display:flex;background:var(--field-bg);border:1px solid var(--border);border-radius:8px;overflow:hidden}
.pw-pvseg button{padding:6px 12px;border:none;background:transparent;cursor:pointer;font:600 11px 'Inter';
  color:var(--muted);transition:all var(--dur)}
.pw-pvseg button.pw-on{background:var(--accent);color:var(--accent-tx)}
.pw-pv-body{flex:1;overflow:auto;padding:6px 18px 18px;display:flex;align-items:flex-start;justify-content:center}
.pw-pv{width:100%;max-width:360px;animation:pw-fadeUp .3s var(--ease)}

/* Aperçu — Connexion */
.pw-mini-login{border-radius:14px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.28);
  background:var(--surface);border:1px solid var(--border)}
.pw-ml-hd{background:linear-gradient(160deg,var(--chrome2),color-mix(in srgb,var(--chrome2) 55%,#000));
  padding:14px 18px;display:flex;align-items:center;gap:11px}
.pw-ml-logo{width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.12);display:flex;
  align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
.pw-ml-logo img{width:100%;height:100%;object-fit:contain}.pw-ml-logo svg{width:22px;height:22px}
.pw-ml-t{font-size:14px;font-weight:800;color:#fff;line-height:1.15}
.pw-ml-s{font-size:9.5px;color:rgba(255,255,255,.55);margin-top:2px}
.pw-ml-bd{padding:16px 18px}
.pw-mlab{font:700 9px 'Inter';text-transform:uppercase;letter-spacing:.1em;color:var(--muted);margin:0 0 4px}
.pw-mfield{height:34px;border-radius:8px;border:1.5px solid var(--field-bd);background:var(--field-bg);
  margin-bottom:11px;display:flex;align-items:center;padding:0 11px;color:var(--subtle);font-size:12px}
.pw-ml-btn{width:100%;height:38px;border:none;border-radius:8px;background:var(--accent);color:var(--accent-tx);
  font:700 13px 'Inter';cursor:pointer;box-shadow:var(--glow);transition:filter var(--dur),transform var(--dur)}
.pw-ml-btn:hover{filter:brightness(1.08);transform:translateY(-1px)}
.pw-ml-strip{display:flex;height:5px}.pw-ml-strip i{flex:1}
.pw-ml-strip i:nth-child(1){flex:3;background:#16A34A}
.pw-ml-strip i:nth-child(2){flex:2;background:var(--accent)}
.pw-ml-strip i:nth-child(3){flex:2;background:#F59E0B}

/* Aperçu — Application */
.pw-mini-app{border-radius:12px;overflow:hidden;border:1px solid var(--border);
  box-shadow:0 10px 30px rgba(0,0,0,.2);background:var(--surface)}
.pw-ma-tb{height:28px;background:linear-gradient(180deg,var(--chrome1),var(--chrome2));display:flex;
  align-items:center;padding:0 10px}
.pw-ma-star{width:13px;height:13px;margin-right:6px;display:flex}
.pw-ma-tb b{font-size:10.5px;color:rgba(255,255,255,.9);font-weight:600}
.pw-ma-body{display:flex;height:200px}
.pw-ma-sb{width:66px;background:linear-gradient(180deg,var(--chrome2),color-mix(in srgb,var(--chrome2) 55%,#000));
  display:flex;flex-direction:column;align-items:center;padding:10px 0;gap:8px}
.pw-ma-lg{width:40px;height:40px;border-radius:11px;background:rgba(255,255,255,.12);display:flex;
  align-items:center;justify-content:center;overflow:hidden}
.pw-ma-lg img{width:100%;height:100%;object-fit:contain}.pw-ma-lg svg{width:22px;height:22px}
.pw-nb{width:46px;height:34px;border-radius:8px;display:flex;align-items:center;justify-content:center;
  color:rgba(255,255,255,.6);font-size:16px}
.pw-nb.pw-ac{background:rgba(255,255,255,.14);color:#fff;position:relative}
.pw-nb.pw-ac::before{content:'';position:absolute;left:-10px;top:20%;bottom:20%;width:3px;border-radius:0 3px 3px 0;
  background:var(--accent);box-shadow:var(--glow)}
.pw-ma-main{flex:1;padding:12px;background-color:var(--surface2);
  background-image:radial-gradient(circle,var(--dot) 1px,transparent 1px);background-size:16px 16px}
.pw-ma-card{background:var(--surface);border:1px solid var(--border);border-left:4px solid var(--accent);
  border-radius:0 8px 8px 0;padding:10px 12px;box-shadow:0 2px 8px rgba(0,0,0,.06);margin-bottom:8px}
.pw-ma-card .pw-h{font:800 9px 'Inter';text-transform:uppercase;letter-spacing:.6px;color:var(--accent);margin-bottom:7px}
.pw-ma-line{height:8px;border-radius:4px;background:var(--border-soft);margin-bottom:6px}
.pw-ma-line.pw-s{width:60%}
.pw-ma-badge{display:inline-block;padding:3px 9px;border-radius:5px;background:var(--chrome2);color:#F59E0B;
  font:800 11px 'Inter';letter-spacing:1px}

/* Aperçu — Document imprimé (toujours sur papier blanc) */
.pw-mini-doc{background:#fff;color:#0F172A;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,.25);padding:20px;font-size:11px}
.pw-md-hd{display:flex;align-items:center;gap:12px;border-bottom:2px solid var(--accent);padding-bottom:12px;margin-bottom:12px}
.pw-md-logo{width:52px;height:52px;border-radius:8px;background:color-mix(in srgb,var(--accent) 14%,#fff);
  display:flex;align-items:center;justify-content:center;overflow:hidden;flex-shrink:0}
.pw-md-logo img{width:100%;height:100%;object-fit:contain}.pw-md-logo svg{width:30px;height:30px}
.pw-md-co{flex:1}.pw-md-co b{font-size:14px;font-weight:800;color:#0F172A;display:block}
.pw-md-co span{font-size:9.5px;color:#64748B}
.pw-md-ti{text-align:right}.pw-md-ti b{font-size:12px;color:var(--accent)}
.pw-md-ti span{font-size:9px;color:#94A3B8;display:block}
.pw-md-rows{border:1px solid #E2E8F0;border-radius:6px;overflow:hidden;margin-bottom:12px}
.pw-md-rows .pw-r{display:flex;border-bottom:1px solid #F1F5F9}.pw-md-rows .pw-r:last-child{border:none}
.pw-md-rows .pw-r .pw-k{width:42%;background:#F8FAFC;padding:6px 9px;font-weight:600;color:#64748B;font-size:10px}
.pw-md-rows .pw-r .pw-v{flex:1;padding:6px 9px;font-size:10.5px;font-weight:600}
.pw-md-ft{display:flex;justify-content:space-between;align-items:flex-end;font-size:9px;color:#64748B}
.pw-stamp{width:64px;height:64px;border-radius:50%;border:2px dashed color-mix(in srgb,var(--accent) 55%,#fff);
  display:flex;align-items:center;justify-content:center;color:var(--accent);font-weight:800;font-size:8px;
  text-align:center;transform:rotate(-8deg)}
.pw-md-devise{color:var(--accent);font-weight:800}

/* Pied fenêtre */
.pw-ft{display:flex;align-items:center;gap:10px;padding:11px 16px;border-top:1px solid var(--border);
  flex-shrink:0;background:var(--surface)}
.pw-hint{flex:1;font-size:10.5px;color:var(--subtle)}
.pw-hint code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:10px}
.pw-btn{height:36px;padding:0 18px;border-radius:8px;font:700 12.5px 'Inter';cursor:pointer;transition:all var(--dur)}
.pw-btn.pw-ghost{background:transparent;border:1.5px solid var(--field-bd);color:var(--muted)}
.pw-btn.pw-ghost:hover{border-color:var(--muted);color:var(--text)}
.pw-btn.pw-primary{background:var(--accent);color:var(--accent-tx);border:none;box-shadow:var(--glow)}
.pw-btn.pw-primary:hover{filter:brightness(1.08);transform:translateY(-1px)}

/* Toast */
.pw-toast{position:fixed;bottom:40px;left:50%;transform:translateX(-50%) translateY(20px);opacity:0;
  background:var(--accent);color:var(--accent-tx);padding:11px 20px;border-radius:10px;font-weight:700;font-size:12.5px;
  box-shadow:0 8px 30px color-mix(in srgb,var(--accent) 45%,transparent);pointer-events:none;
  transition:all .3s var(--ease);z-index:999}
.pw-toast.pw-show{opacity:1;transform:translateX(-50%) translateY(0)}
`
