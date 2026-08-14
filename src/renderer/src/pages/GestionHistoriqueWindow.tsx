import { useState } from 'react'
import { Modal } from 'antd'
import {
  DOMAINES, useHistorique, addHistorique, removeHistorique, renameHistorique, viderHistorique,
  type DomaineHistorique,
} from '@mock/historiquesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Fenêtre GÉNÉRIQUE de gestion d'un historique de saisie (Noms, Pays, Parcs,
// Transit, Préfixes de châssis). Ouverte depuis Fichier › Gestion des Historiques
// de Saisie, ou via le bouton à côté du champ. Recherche + double-clic pour
// CHARGER une valeur dans le champ d'origine du formulaire (signal tcit_hist_pick).
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  blue: 'var(--tc-heading)', accent: 'var(--accent)', muted: 'var(--tc-muted)',
  border: 'var(--tc-line)', red: '#DC2626', bg: 'var(--tc-section)',
}

// Champ du formulaire ciblé par défaut (si la fenêtre est ouverte depuis le menu,
// sans champ d'origine précis).
const DEFAUT_CHAMP: Record<DomaineHistorique, string> = {
  nom: 'nomAcheteur', pays: 'paysResidence', parc: 'description', transit: 'maisonTransit', chassis: 'chassis',
}

export default function GestionHistoriqueWindow({ domaine }: { domaine: DomaineHistorique }): JSX.Element {
  const cfg = DOMAINES[domaine]
  const liste = useHistorique(domaine)
  const [nouveau, setNouveau] = useState('')
  const [recherche, setRecherche] = useState('')
  const [editing, setEditing] = useState<string | null>(null) // valeur en cours d'édition
  const [editVal, setEditVal] = useState('')

  const filtre = recherche.trim().toLowerCase()
  const affichee = filtre ? liste.filter(v => v.toLowerCase().includes(filtre)) : liste

  const fermer = (): void => { window.dispatchEvent(new CustomEvent('mdi:close-self')) }

  const ajouter = (): void => {
    const v = nouveau.trim()
    if (!v) return
    addHistorique(domaine, v)
    setNouveau('')
  }

  const lancerEdit = (valeur: string): void => { setEditing(valeur); setEditVal(valeur) }
  const validerEdit = (ancien: string): void => {
    const v = editVal.trim()
    if (v && v !== ancien) renameHistorique(domaine, ancien, v)
    setEditing(null)
  }

  // Double-clic → charge la valeur dans le champ d'origine du formulaire, puis ferme.
  // On lit l'origine FRAÎCHE au moment du clic (le bouton du champ la pose juste
  // avant d'ouvrir/refocaliser la fenêtre), puis on la consomme. Ainsi, rouvrir
  // la même fenêtre depuis un AUTRE champ (ex. Pays Destination alors qu'elle est
  // déjà ouverte pour Résidence) cible bien le bon champ.
  const charger = (v: string): void => {
    let champ: string | null = null
    try { champ = localStorage.getItem('tcit_hist_origine'); localStorage.removeItem('tcit_hist_origine') } catch { /* ignore */ }
    localStorage.setItem('tcit_hist_pick', JSON.stringify({ champ: champ ?? DEFAUT_CHAMP[domaine], valeur: v, ts: Date.now() }))
    fermer()
  }

  const viderTout = (): void => {
    Modal.confirm({
      title: 'Vider tout l\'historique ?',
      content: `${liste.length} entrée(s) de « ${cfg.label} » seront supprimées définitivement.`,
      okText: 'Vider', cancelText: 'Annuler', okButtonProps: { danger: true },
      onOk: () => viderHistorique(domaine),
    })
  }

  return (
    <div style={{ animation: 'formEnter 0.3s ease', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Sub-header beige */}
      <div style={{
        background: 'var(--tc-subheader-bg)', borderBottom: '2px solid var(--tc-subheader-bd)',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <span style={{ fontSize: 20 }}>{cfg.icone}</span>
        <div>
          <div style={{ color: C.blue, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>{cfg.label}</div>
          <div style={{ color: C.muted, fontSize: 10.5, marginTop: 1 }}>Double-cliquez sur une valeur pour la charger dans le champ.</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, minHeight: 0 }}>
        {/* Recherche */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted, fontSize: 12, pointerEvents: 'none' }}>🔍</span>
          <input
            className="light-input" value={recherche}
            placeholder="Rechercher…"
            onChange={e => setRecherche(e.target.value)}
            style={{ height: 30, paddingLeft: 30 }}
          />
        </div>

        {/* Ajout */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="light-input" value={nouveau}
            placeholder={`Ajouter — ${cfg.placeholder.toLowerCase()}`}
            onChange={e => setNouveau(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') ajouter() }}
            style={{ flex: 1, height: 30 }}
          />
          <button
            onClick={ajouter} disabled={!nouveau.trim()}
            style={{
              height: 30, padding: '0 16px', border: 'none', borderRadius: 6,
              background: nouveau.trim() ? C.accent : '#CBD5E1', color: '#fff',
              fontSize: 12, fontWeight: 700, cursor: nouveau.trim() ? 'pointer' : 'default',
            }}
          >+ Ajouter</button>
        </div>

        {/* En-tête clair */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '7px 12px',
          background: 'var(--tc-thead-bg)', borderBottom: '2px solid var(--tc-thead-bd)', borderRadius: '6px 6px 0 0',
          fontSize: 10.5, fontWeight: 800, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.4,
        }}>
          <span style={{ width: 30 }}>#</span>
          <span style={{ flex: 1 }}>Valeur mémorisée</span>
          <span style={{ width: 108, textAlign: 'right' }}>Actions</span>
        </div>

        {/* Liste (filtrée) */}
        <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
          {affichee.length === 0 ? (
            <div style={{ padding: '30px 14px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
              {liste.length === 0
                ? "Aucune entrée pour l'instant — l'historique se remplit à chaque enregistrement."
                : 'Aucun résultat pour cette recherche.'}
            </div>
          ) : affichee.map((v, i) => (
            <div
              key={v} className="hist-row"
              title="Double-cliquez pour charger dans le champ"
              onDoubleClick={() => { if (editing !== v) charger(v) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                borderBottom: `1px solid var(--tc-card-bd)`, fontSize: 12, cursor: 'pointer',
              }}
            >
              <span style={{ width: 22, color: C.muted, fontSize: 10.5 }}>{i + 1}</span>
              {editing === v ? (
                <input
                  className="light-input" value={editVal} autoFocus
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') validerEdit(v); if (e.key === 'Escape') setEditing(null) }}
                  onBlur={() => validerEdit(v)}
                  onDoubleClick={e => e.stopPropagation()}
                  style={{ flex: 1, height: 26 }}
                />
              ) : (
                <span style={{ flex: 1, color: 'var(--tc-text)', fontWeight: 600 }}>{v}</span>
              )}
              <div style={{ width: 102, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <button title="Charger cette valeur dans le champ" onClick={e => { e.stopPropagation(); charger(v) }}
                  style={{ width: 26, height: 26, border: `1px solid #A7D8B8`, borderRadius: 6, background: '#F0FDF4', cursor: 'pointer', color: '#16A34A', fontSize: 12 }}>📥</button>
                <button title="Modifier" onClick={e => { e.stopPropagation(); lancerEdit(v) }}
                  style={{ width: 26, height: 26, border: `1px solid ${C.border}`, borderRadius: 6, background: 'var(--tc-card)', cursor: 'pointer', color: C.accent }}>✎</button>
                <button title="Supprimer" onClick={e => { e.stopPropagation(); removeHistorique(domaine, v) }}
                  style={{ width: 26, height: 26, border: `1px solid #FCA5A5`, borderRadius: 6, background: 'var(--tc-card)', cursor: 'pointer', color: C.red }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        {/* Pied */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: C.muted }}>
            {filtre ? `${affichee.length} / ${liste.length}` : `${liste.length}`} entrée(s)
          </span>
          <div style={{ flex: 1 }} />
          {liste.length > 0 && (
            <button onClick={viderTout}
              style={{ height: 30, padding: '0 14px', border: `1px solid #FCA5A5`, borderRadius: 6, background: 'var(--tc-card)', color: C.red, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', marginRight: 8 }}>
              Vider tout
            </button>
          )}
          <button onClick={fermer}
            style={{ height: 30, padding: '0 18px', border: 'none', borderRadius: 6, background: C.blue, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Fermer
          </button>
        </div>
      </div>
    </div>
  )
}
