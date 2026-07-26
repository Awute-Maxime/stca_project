import { useState } from 'react'
import { Modal } from 'antd'
import {
  DOMAINES, useHistorique, addHistorique, removeHistorique, renameHistorique, viderHistorique,
  type DomaineHistorique,
} from '@mock/historiquesStore'

// ─────────────────────────────────────────────────────────────────────────────
// Fenêtre GÉNÉRIQUE de gestion d'un historique de saisie (Noms, Pays, Parcs,
// Transit, Préfixes de châssis). Ouverte depuis Fichier › Gestion des Historiques
// de Saisie, ou via le bouton à côté du champ correspondant. Voir / corriger /
// supprimer / ajouter — synchronisé en direct avec le formulaire (store partagé).
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  blue: '#1B3A6B', accent: '#2563EB', muted: '#64748B',
  border: '#E2E8F0', red: '#DC2626', bg: '#F8FAFF',
}

export default function GestionHistoriqueWindow({ domaine }: { domaine: DomaineHistorique }): JSX.Element {
  const cfg = DOMAINES[domaine]
  const liste = useHistorique(domaine)
  const [nouveau, setNouveau] = useState('')
  const [editIdx, setEditIdx] = useState<number | null>(null)
  const [editVal, setEditVal] = useState('')

  const fermer = (): void => { window.dispatchEvent(new CustomEvent('mdi:close-self')) }

  const ajouter = (): void => {
    const v = nouveau.trim()
    if (!v) return
    addHistorique(domaine, v)
    setNouveau('')
  }

  const lancerEdit = (i: number, valeur: string): void => { setEditIdx(i); setEditVal(valeur) }
  const validerEdit = (ancien: string): void => {
    const v = editVal.trim()
    if (v && v !== ancien) renameHistorique(domaine, ancien, v)
    setEditIdx(null)
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
      {/* Sub-header beige (convention maison) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 11,
      }}>
        <span style={{ fontSize: 20 }}>{cfg.icone}</span>
        <div>
          <div style={{ color: C.blue, fontSize: 12, fontWeight: 800, letterSpacing: 0.5, textTransform: 'uppercase' }}>{cfg.label}</div>
          <div style={{ color: C.muted, fontSize: 10.5, marginTop: 1 }}>{cfg.aide}</div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 14, minHeight: 0 }}>
        {/* Ajout */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <input
            className="light-input" value={nouveau} autoFocus
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

        {/* En-tête clair (convention maison) */}
        <div style={{
          display: 'flex', alignItems: 'center', padding: '7px 12px',
          background: '#EEF3FB', borderBottom: '2px solid #DCE6F5', borderRadius: '6px 6px 0 0',
          fontSize: 10.5, fontWeight: 800, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.4,
        }}>
          <span style={{ width: 30 }}>#</span>
          <span style={{ flex: 1 }}>Valeur mémorisée</span>
          <span style={{ width: 80, textAlign: 'right' }}>Actions</span>
        </div>

        {/* Liste */}
        <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${C.border}`, borderTop: 'none', borderRadius: '0 0 6px 6px' }}>
          {liste.length === 0 ? (
            <div style={{ padding: '30px 14px', textAlign: 'center', color: C.muted, fontSize: 12 }}>
              Aucune entrée pour l'instant — l'historique se remplit à chaque enregistrement.
            </div>
          ) : liste.map((v, i) => (
            <div key={v} className="hist-row" style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
              borderBottom: `1px solid #F1F5F9`, fontSize: 12,
            }}>
              <span style={{ width: 22, color: C.muted, fontSize: 10.5 }}>{i + 1}</span>
              {editIdx === i ? (
                <input
                  className="light-input" value={editVal} autoFocus
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') validerEdit(v); if (e.key === 'Escape') setEditIdx(null) }}
                  onBlur={() => validerEdit(v)}
                  style={{ flex: 1, height: 26 }}
                />
              ) : (
                <span style={{ flex: 1, color: '#1E293B', fontWeight: 600 }}>{v}</span>
              )}
              <div style={{ width: 74, display: 'flex', justifyContent: 'flex-end', gap: 4 }}>
                <button title="Modifier" onClick={() => lancerEdit(i, v)}
                  style={{ width: 26, height: 26, border: `1px solid ${C.border}`, borderRadius: 6, background: '#fff', cursor: 'pointer', color: C.accent }}>✎</button>
                <button title="Supprimer" onClick={() => removeHistorique(domaine, v)}
                  style={{ width: 26, height: 26, border: `1px solid #FCA5A5`, borderRadius: 6, background: '#fff', cursor: 'pointer', color: C.red }}>🗑</button>
              </div>
            </div>
          ))}
        </div>

        {/* Pied */}
        <div style={{ display: 'flex', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 11, color: C.muted }}>{liste.length} entrée(s)</span>
          <div style={{ flex: 1 }} />
          {liste.length > 0 && (
            <button onClick={viderTout}
              style={{ height: 30, padding: '0 14px', border: `1px solid #FCA5A5`, borderRadius: 6, background: '#fff', color: C.red, fontSize: 11.5, fontWeight: 600, cursor: 'pointer', marginRight: 8 }}>
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
