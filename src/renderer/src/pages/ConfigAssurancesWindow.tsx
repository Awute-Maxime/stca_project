import { useState } from 'react'
import { notification, InputNumber } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import {
  useConfigAssurances, setConfigAssurances, brutDe, commissionDe, montantARestituerDe, detailDe,
  type Assureur, type TarifAssurance, type DetailPrimes,
} from '@mock/assurancesStore'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION ASSURANCES — fidèle aux captures du vrai STCA (21/07/2026) :
// - « Mise en service des fonctions Assurances » : Imprimer Facture + Cond.
//   Part. + Assurances OUI/NON + Enregistrer,
// - liste des assureurs (nom + coordonnées) + Modifier / Imprimer / Fermer,
// - modal « Création / Modification d'un assureur » : nom, coordonnées, table
//   des tarifs par type de véhicule — Tarif brut = Tarif − Taxe, Commission
//   STCA = brut × % (part reversée à STCA, pour les rapports de revenus).
// Accès protégé par MdpAdminGate (MainScreen). Source unique : assurancesStore
// (consommée par la Facture et le Feuillet N°3).
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number): string => n.toLocaleString('fr-FR')

export default function ConfigAssurancesWindow(): JSX.Element {
  const cfg = useConfigAssurances()
  const [imprimer, setImprimer] = useState<boolean>(() => cfg.imprimerAssurances)
  const [selId, setSelId] = useState<number | null>(cfg.assureurs[0]?.id ?? null)
  const [edition, setEdition] = useState<Assureur | null>(null) // copie de travail du modal

  const enregistrerMiseEnService = (): void => {
    setConfigAssurances({ ...cfg, imprimerAssurances: imprimer })
    notification.success({
      message: '✅ Mise en service enregistrée',
      description: `Imprimer Facture + Cond. Part. + Assurances : ${imprimer ? 'OUI' : 'NON'}.`,
      placement: 'bottomRight',
    })
  }

  // Le modal (2 tableaux) demande plus de hauteur que la liste : la fenêtre
  // s'agrandit à l'ouverture et reprend sa taille à la fermeture
  const ouvrirModal = (a: Assureur): void => {
    window.resizeTo(950, 700)
    setEdition(a)
  }

  const fermerModal = (): void => {
    setEdition(null)
    window.resizeTo(950, 475)
  }

  const ouvrirModification = (): void => {
    const a = cfg.assureurs.find(x => x.id === selId) ?? cfg.assureurs[0]
    if (!a) return
    ouvrirModal(JSON.parse(JSON.stringify(a)) as Assureur)
  }

  const ouvrirCreation = (): void => {
    const id = cfg.assureurs.reduce((m, a) => Math.max(m, a.id), 0) + 1
    ouvrirModal({
      id, nom: '', coordonnees: '',
      tarifs: [{ type: 'Voiture', tarif: 13000, taxe: 679, commissionPct: 20 }],
    })
  }

  const validerEdition = (): void => {
    if (!edition) return
    if (!edition.nom.trim()) {
      notification.warning({ message: "Saisissez le nom de l'assurance ou du groupement.", placement: 'bottomRight' })
      return
    }
    const existe = cfg.assureurs.some(a => a.id === edition.id)
    const assureurs = existe
      ? cfg.assureurs.map(a => a.id === edition.id ? edition : a)
      : [...cfg.assureurs, edition]
    setConfigAssurances({ ...cfg, assureurs })
    setSelId(edition.id)
    fermerModal()
    notification.success({
      message: `✅ Assureur « ${edition.nom} » enregistré`,
      description: 'Les tarifs alimentent la Facture, le Feuillet N°3 et les rapports de revenus.',
      placement: 'bottomRight',
    })
  }

  const imprimerListe = (): void => {
    const cle = 'apercu.listeAssurances'
    const c = WINDOW_REGISTRY[cle]
    if (c) electronApi.mdiOpen({ id: cle, x: c.defaultX, y: c.defaultY, width: c.width, height: c.height })
  }

  const majTarif = (i: number, changes: Partial<TarifAssurance>): void => {
    if (!edition) return
    setEdition({
      ...edition,
      tarifs: edition.tarifs.map((t, j) => {
        if (j !== i) return t
        const nouveau = { ...t, ...changes }
        if ('tarif' in changes) {
          // Le Tarif est maître : le détail des primes est re-réparti
          // proportionnellement (modifiable ensuite dans la rubrique détail)
          nouveau.detail = undefined
        } else if ('taxe' in changes && nouveau.detail) {
          // Taxe modifiée avec un détail saisi → le tarif suit la somme
          const d = nouveau.detail
          nouveau.tarif = d.rc + d.cedeao + d.individuelle + d.accessoires + nouveau.taxe
        }
        return nouveau
      }),
    })
  }

  // Modifier une prime du détail → le Tarif se recalcule (somme + taxe)
  const majDetail = (i: number, changes: Partial<DetailPrimes>): void => {
    if (!edition) return
    setEdition({
      ...edition,
      tarifs: edition.tarifs.map((t, j) => {
        if (j !== i) return t
        const d = { ...detailDe(t), ...changes }
        return { ...t, detail: d, tarif: d.rc + d.cedeao + d.individuelle + d.accessoires + t.taxe }
      }),
    })
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const btnDroit: React.CSSProperties = {
    width: '100%', padding: '8px 6px', fontSize: 11.5, borderRadius: 5, cursor: 'pointer',
    border: '1px solid #CBD5E1', background: '#fff', color: '#1E293B', fontWeight: 600,
  }
  const TH: React.CSSProperties = {
    background: 'linear-gradient(180deg, #2B5AA8, #1B3A6B)', color: '#fff',
    fontSize: 11, fontWeight: 700, padding: '6px 10px', textAlign: 'left',
  }
  const TD: React.CSSProperties = { fontSize: 11.5, padding: '6px 10px', borderBottom: '1px solid #EEF2F7' }
  const NUM: React.CSSProperties = { width: 90 }
  const THM: React.CSSProperties = {
    background: '#EEF3FB', color: '#1B3A6B', fontSize: 10.5, fontWeight: 700,
    padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #D7E3F4', lineHeight: 1.25,
  }
  const TDM: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #EEF2F7', textAlign: 'center' }

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Sub-header beige (modèle validé) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <SafetyCertificateOutlined style={{ color: '#1B3A6B', fontSize: 15 }} />
        <span style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
          Liste d&apos;assureur ou Groupement d&apos;assurance
        </span>
        <span style={{ color: '#64748B', fontSize: 10.5 }}>
          {cfg.assureurs.length} assureur(s)
        </span>
      </div>

      {/* ── Mise en service des fonctions Assurances (capture 1) ──────────── */}
      <div style={{
        border: '1px solid #BFDBFE', background: '#F8FBFF', borderRadius: 8,
        padding: '10px 14px', marginBottom: 10,
      }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#1D4ED8', marginBottom: 8 }}>
          &raquo;&raquo; Mise en service des fonctions Assurances
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: '#1E293B' }}>
            Imprimer Facture + Cond. Part. + Assurances :
          </span>
          {[true, false].map(v => (
            <label key={String(v)} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: v ? '#16A34A' : '#DC2626' }}>
              <input type="radio" name="mise-en-service" checked={imprimer === v}
                onChange={() => setImprimer(v)} style={{ accentColor: '#2563EB' }} />
              {v ? 'OUI' : 'NON'}
            </label>
          ))}
          <button onClick={enregistrerMiseEnService} style={{
            marginLeft: 'auto', height: 30, padding: '0 18px', borderRadius: 5, cursor: 'pointer',
            border: 'none', background: '#16A34A', color: '#fff', fontSize: 12, fontWeight: 700,
          }}>Enregistrer ✔</button>
        </div>
      </div>

      {/* ── Liste + boutons (capture 1) ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH}>Nom Assurance / Groupement Assurance</th>
                <th style={{ ...TH, width: '45%' }}>Coordonnées</th>
              </tr>
            </thead>
            <tbody>
              {cfg.assureurs.map(a => {
                const sel = a.id === selId
                return (
                  <tr key={a.id} onClick={() => setSelId(a.id)} onDoubleClick={() => { setSelId(a.id); ouvrirModification() }}
                    style={{ cursor: 'pointer', background: sel ? '#DBEAFE' : undefined }}>
                    <td style={{ ...TD, fontWeight: 700, color: '#1B3A6B', textTransform: 'uppercase' }}>{a.nom}</td>
                    <td style={TD}>{a.coordonnees}</td>
                  </tr>
                )
              })}
              {/* Lignes vides pour retrouver la grille du vrai STCA */}
              {Array.from({ length: Math.max(0, 8 - cfg.assureurs.length) }, (_, i) => (
                <tr key={`vide-${i}`}>
                  <td style={{ ...TD, height: 26 }}>&nbsp;</td>
                  <td style={TD}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={btnDroit} onClick={ouvrirModification}>✏ Modifier</button>
          <button style={btnDroit} onClick={ouvrirCreation}>➕ Nouvel assureur</button>
          <button style={{ ...btnDroit, marginTop: 24 }} onClick={imprimerListe}>🖨 Imprimer</button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
            style={{ ...btnDroit, marginTop: 'auto', border: '1px solid #FECACA', background: '#FFF5F5', color: '#DC2626', fontWeight: 700 }}>
            Fermer ⊗
          </button>
        </div>
      </div>

      {/* ── Modal Création / Modification d'un assureur (capture 2) ────────── */}
      {edition && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 800,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 10, width: 920, maxWidth: '97vw',
            boxShadow: '0 20px 60px rgba(0,0,0,0.25)', animation: 'formEnter 0.2s ease',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', padding: '12px 18px',
              background: '#1B3A6B', borderRadius: '10px 10px 0 0',
            }}>
              <span style={{ fontSize: 12, marginRight: 8 }}>🛡</span>
              <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>
                Création / Modification d&apos;un assureur
              </span>
              <button onClick={fermerModal} style={{
                width: 26, height: 26, background: 'none', border: 'none',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 17,
              }}>✕</button>
            </div>

            <div style={{ padding: '16px 20px' }}>
              {/* Nom + coordonnées (disposition de la capture) */}
              <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1B3A6B', marginBottom: 4 }}>
                    Nom de l&apos;assurance ou groupement
                  </div>
                  <input className="light-input" value={edition.nom}
                    onChange={e => setEdition({ ...edition, nom: e.target.value })}
                    style={{ width: '100%', height: 28, fontWeight: 700, color: '#1D4ED8', textAlign: 'center', textTransform: 'uppercase' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#1B3A6B', marginBottom: 4 }}>
                    Coordonnées ( adresse cp ville tel etc … )
                  </div>
                  <input className="light-input" value={edition.coordonnees}
                    onChange={e => setEdition({ ...edition, coordonnees: e.target.value })}
                    style={{ width: '100%', height: 28 }} />
                </div>
              </div>

              {/* Barre d'outils tarifs (➕ / comme la capture) */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
                <button title="Ajouter un type de véhicule" onClick={() => setEdition({
                  ...edition,
                  tarifs: [...edition.tarifs, { type: '', tarif: 12000, taxe: 679, commissionPct: 20 }],
                })} style={{
                  height: 26, padding: '0 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11.5,
                  border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontWeight: 700,
                }}>➕ Ajouter un type</button>
                <span style={{ fontSize: 10.5, color: '#64748B', alignSelf: 'center' }}>
                  Tarif brut = Tarif − Taxe &nbsp;·&nbsp; Commission STCA = brut × % &nbsp;·&nbsp; Montant à restituer = Tarif − Commission
                </span>
              </div>

              {/* Table des tarifs (colonnes de la capture + net assureur) */}
              <div style={{ border: '1px solid #D7E3F4', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...THM, textAlign: 'left', width: 150 }}>Type de véhicule (voiture, camion etc…)</th>
                      <th style={THM}>Tarif</th>
                      <th style={THM}>Tarif brut</th>
                      <th style={THM}>Taxe</th>
                      <th style={THM}>Commission stca (% sur le brut)</th>
                      <th style={THM}>Montant de la commission</th>
                      <th style={THM}>Montant à restituer</th>
                      <th style={{ ...THM, width: 30 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {edition.tarifs.map((t, i) => (
                      <tr key={i}>
                        <td style={{ ...TDM, textAlign: 'left' }}>
                          <input className="light-input" value={t.type} placeholder="ex : Voiture"
                            onChange={e => majTarif(i, { type: e.target.value })}
                            style={{ width: '100%', height: 26, fontWeight: 600 }} />
                        </td>
                        <td style={TDM}>
                          <InputNumber size="small" value={t.tarif} min={0} step={500} style={NUM}
                            onChange={v => majTarif(i, { tarif: v ?? 0 })} />
                        </td>
                        <td style={{ ...TDM, fontWeight: 700, color: '#1B3A6B', fontSize: 11.5 }}>{fmt(brutDe(t))}</td>
                        <td style={TDM}>
                          <InputNumber size="small" value={t.taxe} min={0} step={1} style={{ width: 76 }}
                            onChange={v => majTarif(i, { taxe: v ?? 0 })} />
                        </td>
                        <td style={TDM}>
                          <InputNumber size="small" value={t.commissionPct} min={0} max={100} step={0.5}
                            decimalSeparator="," style={{ width: 76 }}
                            onChange={v => majTarif(i, { commissionPct: v ?? 0 })} />
                        </td>
                        <td style={{ ...TDM, fontWeight: 700, color: '#16A34A', fontSize: 11.5 }}>{fmt(commissionDe(t))}</td>
                        <td style={{ ...TDM, fontWeight: 700, color: '#1B3A6B', fontSize: 11.5 }}>{fmt(montantARestituerDe(t))}</td>
                        <td style={TDM}>
                          <button title="Supprimer cette ligne" onClick={() => setEdition({
                            ...edition, tarifs: edition.tarifs.filter((_, j) => j !== i),
                          })} style={{
                            width: 22, height: 22, border: 'none', background: 'none',
                            color: '#DC2626', cursor: 'pointer', fontSize: 13,
                          }}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Détail des primes constituant le tarif (Feuillet N°3) ── */}
              <div style={{ margin: '16px 0 4px', display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1B3A6B' }}>
                  Détail des primes constituant le tarif
                </span>
                <span style={{ fontSize: 10, color: '#64748B' }}>
                  (imprimé sur le Feuillet N°3 — Cond. Part.) · modifier une prime recalcule le Tarif ;
                  modifier le Tarif ci-dessus répartit à nouveau les primes
                </span>
              </div>
              <div style={{ border: '1px solid #D7E3F4', borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={{ ...THM, textAlign: 'left', width: 150 }}>Type de véhicule</th>
                      <th style={THM}>R.C. (Resp. Civile)</th>
                      <th style={THM}>CEDEAO</th>
                      <th style={THM}>Individuelle Accidents</th>
                      <th style={THM}>Accessoires</th>
                      <th style={THM}>Taxes</th>
                      <th style={THM}>= Tarif (TTC)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {edition.tarifs.map((t, i) => {
                      const d = detailDe(t)
                      return (
                        <tr key={i}>
                          <td style={{ ...TDM, textAlign: 'left', fontWeight: 600, fontSize: 11.5, color: '#1E293B' }}>
                            {t.type || '—'}
                          </td>
                          <td style={TDM}>
                            <InputNumber size="small" value={d.rc} min={0} step={100} style={{ width: 82 }}
                              onChange={v => majDetail(i, { rc: v ?? 0 })} />
                          </td>
                          <td style={TDM}>
                            <InputNumber size="small" value={d.cedeao} min={0} step={50} style={{ width: 74 }}
                              onChange={v => majDetail(i, { cedeao: v ?? 0 })} />
                          </td>
                          <td style={TDM}>
                            <InputNumber size="small" value={d.individuelle} min={0} step={100} style={{ width: 82 }}
                              onChange={v => majDetail(i, { individuelle: v ?? 0 })} />
                          </td>
                          <td style={TDM}>
                            <InputNumber size="small" value={d.accessoires} min={0} step={100} style={{ width: 82 }}
                              onChange={v => majDetail(i, { accessoires: v ?? 0 })} />
                          </td>
                          <td style={{ ...TDM, color: '#64748B', fontSize: 11.5 }}>{fmt(t.taxe)}</td>
                          <td style={{ ...TDM, fontWeight: 700, color: '#1D4ED8', fontSize: 11.5 }}>{fmt(t.tarif)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Valider / Quitter (capture) */}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                <button onClick={validerEdition} style={{
                  height: 32, padding: '0 26px', background: '#16A34A', color: '#fff',
                  border: 'none', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}>Valider ✔</button>
                <button onClick={fermerModal} style={{
                  height: 32, padding: '0 22px', background: '#DC2626', color: '#fff',
                  border: 'none', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
                }}>Quitter ⊗</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
