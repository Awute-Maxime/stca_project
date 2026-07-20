import { useState } from 'react'
import { notification, InputNumber } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import {
  getConfigAssurances, setConfigAssurances, brutDe, commissionDe, montantARestituerDe,
  detailDe, appliquerTarif,
  type Assureur, type TarifAssurance, type DetailPrimes,
} from '@mock/assurancesStore'

// ─────────────────────────────────────────────────────────────────────────────
// CRÉATION / MODIFICATION D'UN ASSUREUR — fenêtre BrowserWindow INDÉPENDANTE
// (demande utilisateur du 21/07/2026 : le modal ne pouvait pas sortir de sa
// fenêtre maître — Règle 10, les fenêtres liées sont de vraies fenêtres).
// Ouverte par Config. Assurances via localStorage 'tcit_edition_assureur'
// { assureur, ts } ; Valider écrit dans assurancesStore (source unique) —
// la fenêtre liste se synchronise automatiquement (event storage).
// ─────────────────────────────────────────────────────────────────────────────

const fmt = (n: number): string => n.toLocaleString('fr-FR')

function chargerAssureur(): Assureur {
  let assureur: Assureur | null = null
  try {
    const raw = localStorage.getItem('tcit_edition_assureur')
    if (raw) {
      const p = JSON.parse(raw) as { assureur: Assureur }
      if (p.assureur) assureur = p.assureur
    }
  } catch { /* défaut */ }
  if (!assureur) {
    // Repli : premier assureur de la config
    assureur = JSON.parse(JSON.stringify(getConfigAssurances().assureurs[0])) as Assureur
  }
  // Détail matérialisé sur chaque ligne : les règles fixe/adaptatif
  // s'appliquent toujours sur des valeurs visibles
  return { ...assureur, tarifs: assureur.tarifs.map(t => ({ ...t, detail: detailDe(t) })) }
}

export default function EditionAssureurWindow(): JSX.Element {
  const [edition, setEdition] = useState<Assureur>(chargerAssureur)

  const fermer = (): void => {
    window.dispatchEvent(new CustomEvent('mdi:close-self'))
  }

  const valider = (): void => {
    if (!edition.nom.trim()) {
      notification.warning({ message: "Saisissez le nom de l'assurance ou du groupement.", placement: 'bottomRight' })
      return
    }
    const cfg = getConfigAssurances() // état frais — la liste peut avoir bougé
    const existe = cfg.assureurs.some(a => a.id === edition.id)
    const assureurs = existe
      ? cfg.assureurs.map(a => a.id === edition.id ? edition : a)
      : [...cfg.assureurs, edition]
    setConfigAssurances({ ...cfg, assureurs })
    notification.success({
      message: `✅ Assureur « ${edition.nom} » enregistré`,
      description: 'Les tarifs alimentent la Facture, le Feuillet N°3 et les rapports de revenus.',
      placement: 'bottomRight',
    })
    setTimeout(fermer, 350)
  }

  // ── Règle métier (précisée le 22/07/2026) : le TARIF fixé en haut NE
  // CHANGE JAMAIS depuis le détail — il EST le Tarif TTC du bas. Taxes,
  // CEDEAO et Accessoires sont statiques ; SEULES R.C. et Individuelle
  // fluctuent pour que la somme retombe toujours sur le tarif. ──────────────
  const reequilibrer = (t: TarifAssurance, d: DetailPrimes, fixe?: 'rc' | 'individuelle'): TarifAssurance => {
    const reste = Math.max(0, t.tarif - t.taxe - d.cedeao - d.accessoires) // part R.C. + Individuelle
    let rc = d.rc
    let individuelle = d.individuelle
    if (fixe === 'rc') {
      rc = Math.min(Math.max(0, d.rc), reste)
      individuelle = reste - rc
    } else if (fixe === 'individuelle') {
      individuelle = Math.min(Math.max(0, d.individuelle), reste)
      rc = reste - individuelle
    } else {
      // Répartition au prorata des valeurs courantes (tarif/taxe/CEDEAO/accessoires modifiés)
      const base = d.rc + d.individuelle
      rc = base > 0 ? Math.round(reste * d.rc / base) : Math.round(reste * 5065 / 8815)
      individuelle = reste - rc
    }
    return { ...t, detail: { ...d, rc, individuelle } }
  }

  const majTarif = (i: number, changes: Partial<TarifAssurance>): void => {
    setEdition(prev => ({
      ...prev,
      tarifs: prev.tarifs.map((t, j) => {
        if (j !== i) return t
        if ('tarif' in changes) {
          // Nouveau Tarif : R.C. et Individuelle se répartissent la différence
          return appliquerTarif(t, changes.tarif ?? 0)
        }
        const nouveau = { ...t, ...changes }
        if ('taxe' in changes) {
          // Taxe modifiée : le TARIF NE BOUGE PAS — R.C./Individuelle absorbent
          return reequilibrer(nouveau, detailDe(nouveau))
        }
        return nouveau
      }),
    }))
  }

  // Saisie dans le détail : le Tarif reste FIXE —
  // R.C. ↔ Individuelle se compensent, le reste est statique
  const majDetail = (i: number, changes: Partial<DetailPrimes>): void => {
    setEdition(prev => ({
      ...prev,
      tarifs: prev.tarifs.map((t, j) => {
        if (j !== i) return t
        const d = { ...detailDe(t), ...changes }
        if ('rc' in changes) return reequilibrer(t, d, 'rc')
        if ('individuelle' in changes) return reequilibrer(t, d, 'individuelle')
        return reequilibrer(t, d) // CEDEAO / Accessoires modifiés → prorata
      }),
    }))
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const THM: React.CSSProperties = {
    background: '#EEF3FB', color: '#1B3A6B', fontSize: 10.5, fontWeight: 700,
    padding: '5px 8px', textAlign: 'center', borderBottom: '1px solid #D7E3F4', lineHeight: 1.25,
  }
  const TDM: React.CSSProperties = { padding: '4px 6px', borderBottom: '1px solid #EEF2F7', textAlign: 'center' }

  return (
    <div style={{ animation: 'formEnter 0.3s ease', paddingBottom: 8 }}>
      {/* Sub-header beige (modèle validé) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 12, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <SafetyCertificateOutlined style={{ color: '#1B3A6B', fontSize: 15 }} />
        <span style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
          Création / Modification d&apos;un assureur
        </span>
      </div>

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
          tarifs: [...edition.tarifs, { type: '', tarif: 13000, taxe: 679, commissionPct: 20 }],
        })} style={{
          height: 26, padding: '0 10px', borderRadius: 4, cursor: 'pointer', fontSize: 11.5,
          border: '1px solid #BBF7D0', background: '#F0FDF4', color: '#16A34A', fontWeight: 700,
        }}>➕ Ajouter un type</button>
        <span style={{ fontSize: 10.5, color: '#64748B', alignSelf: 'center' }}>
          Tarif brut = Tarif − Taxe &nbsp;·&nbsp; Commission STCA = brut × % &nbsp;·&nbsp; Montant à restituer = Tarif − Commission
        </span>
      </div>

      {/* Table des tarifs (colonnes de la capture) */}
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
                  <InputNumber size="small" value={t.tarif} min={0} step={500} style={{ width: 90 }}
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

      {/* ── Détail des primes constituant le tarif (Feuillet N°3) ─────────── */}
      <div style={{ margin: '16px 0 4px', display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#1B3A6B' }}>
          Détail des primes constituant le tarif
        </span>
        <span style={{ fontSize: 10, color: '#64748B' }}>
          (imprimé sur le Feuillet N°3 — Cond. Part.) · le Tarif TTC est FIXÉ en haut et ne change jamais ici ·
          seules R.C. et Individuelle fluctuent pour retomber sur le Tarif — le reste est statique
        </span>
      </div>
      <div style={{ border: '1px solid #D7E3F4', borderRadius: 6, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...THM, textAlign: 'left', width: 140 }}>Type de véhicule</th>
              <th style={THM}>R.C. (Resp. Civile)</th>
              <th style={THM}>CEDEAO</th>
              <th style={THM}>Individuelle Accidents</th>
              <th style={THM}>Prime totale nette</th>
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
                  <td style={{ ...TDM, fontWeight: 700, color: '#1B3A6B', fontSize: 11.5 }}>
                    {fmt(d.rc + d.cedeao + d.individuelle)}
                  </td>
                  <td style={TDM}>
                    <InputNumber size="small" value={d.accessoires} min={0} step={100} style={{ width: 82 }}
                      onChange={v => majDetail(i, { accessoires: v ?? 0 })} />
                  </td>
                  <td style={TDM}>
                    <InputNumber size="small" value={t.taxe} min={0} step={1} style={{ width: 74 }}
                      onChange={v => majTarif(i, { taxe: v ?? 0 })} />
                  </td>
                  <td style={{ ...TDM, fontWeight: 700, color: '#1D4ED8', fontSize: 11.5 }}>{fmt(t.tarif)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Valider / Quitter (capture) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
        <button onClick={valider} style={{
          height: 32, padding: '0 26px', background: '#16A34A', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Valider ✔</button>
        <button onClick={fermer} style={{
          height: 32, padding: '0 22px', background: '#DC2626', color: '#fff',
          border: 'none', borderRadius: 5, fontSize: 12.5, fontWeight: 700, cursor: 'pointer',
        }}>Quitter ⊗</button>
      </div>
    </div>
  )
}
