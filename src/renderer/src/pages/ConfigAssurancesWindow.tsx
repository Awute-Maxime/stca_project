import { useState } from 'react'
import { notification } from 'antd'
import { SafetyCertificateOutlined } from '@ant-design/icons'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'
import { useConfigAssurances, setConfigAssurances, type Assureur } from '@mock/assurancesStore'

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION ASSURANCES — fidèle aux captures du vrai STCA (21/07/2026) :
// - « Mise en service des fonctions Assurances » : Imprimer Facture + Cond.
//   Part. + Assurances OUI/NON + Enregistrer,
// - liste des assureurs (nom + coordonnées) + Modifier / Imprimer / Fermer.
// Modifier/Nouvel assureur ouvrent la FENÊTRE INDÉPENDANTE edition.assureur
// (déplaçable librement — Règle 10) via localStorage 'tcit_edition_assureur' ;
// la liste se synchronise automatiquement (assurancesStore, event storage).
// Accès protégé par MdpAdminGate (MainScreen).
// ─────────────────────────────────────────────────────────────────────────────

export default function ConfigAssurancesWindow(): JSX.Element {
  const cfg = useConfigAssurances()
  const [imprimer, setImprimer] = useState<boolean>(() => cfg.imprimerAssurances)
  const [selId, setSelId] = useState<number | null>(cfg.assureurs[0]?.id ?? null)

  const enregistrerMiseEnService = (): void => {
    setConfigAssurances({ ...cfg, imprimerAssurances: imprimer })
    notification.success({
      message: '✅ Mise en service enregistrée',
      description: `Imprimer Facture + Cond. Part. + Assurances : ${imprimer ? 'OUI' : 'NON'}.`,
      placement: 'bottomRight',
    })
  }

  const ouvrirEdition = (assureur: Assureur): void => {
    localStorage.setItem('tcit_edition_assureur', JSON.stringify({ assureur, ts: Date.now() }))
    const c = WINDOW_REGISTRY['edition.assureur']
    if (c) electronApi.mdiOpen({ id: 'edition.assureur', x: c.defaultX, y: c.defaultY, width: c.width, height: c.height })
  }

  const ouvrirModification = (): void => {
    const a = cfg.assureurs.find(x => x.id === selId) ?? cfg.assureurs[0]
    if (!a) return
    ouvrirEdition(JSON.parse(JSON.stringify(a)) as Assureur)
  }

  const ouvrirCreation = (): void => {
    const id = cfg.assureurs.reduce((m, a) => Math.max(m, a.id), 0) + 1
    ouvrirEdition({
      id, nom: '', coordonnees: '',
      tarifs: [{ type: 'Voiture', tarif: 13000, taxe: 679, commissionPct: 20 }],
    })
  }

  const imprimerListe = (): void => {
    const cle = 'apercu.listeAssurances'
    const c = WINDOW_REGISTRY[cle]
    if (c) electronApi.mdiOpen({ id: cle, x: c.defaultX, y: c.defaultY, width: c.width, height: c.height })
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
    </div>
  )
}
