import { useState, useMemo } from 'react'
import { Input, Button, Tooltip, Modal, notification } from 'antd'
import {
  CarOutlined, EnvironmentOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, PrinterOutlined, SaveOutlined, CheckOutlined,
} from '@ant-design/icons'
import { mockVehicules } from '@mock/vehicules'
import { getTypesVehicule, setTypesVehicule, type TypeVehicule } from '@mock/typesVehiculeStore'
import { useDestinations, removeDestination, type DestinationParam } from '@mock/destinationsStore'
import { electronApi } from '@api/electron'
import { WINDOW_REGISTRY } from '@windows/WINDOW_REGISTRY'

const C = {
  blue:   '#1B3A6B',
  accent: '#2563EB',
  green:  '#16A34A',
  gold:   '#F59E0B',
  muted:  '#6B7280',
  border: '#E2E8F0',
  bg:     '#F8FAFF',
  danger: '#DC2626',
}

// Sub-header beige (modèle Enregistrement — pas de 2e bandeau bleu sous la barre de titre)
function PageHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }): JSX.Element {
  return (
    <div style={{
      background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
      padding: '9px 14px', marginBottom: 12, borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ color: '#1B3A6B', fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && <div style={{ color: '#64748B', fontSize: 9, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES VÉHICULE — « Liste des Types de Véhicules (pour assurances) »
// Fidèle à la capture STCA (colonnes « Rang dans la combos » + « Nom ou type de
// véhicule », en-tête bleu, lignes de remplissage) mais ÉDITABLE. SOURCE UNIQUE
// (typesVehiculeStore) : cette liste alimente le menu déroulant de
// l'Enregistrement ET les catégories de tarifs de Config. Assurances (lien
// automatique dans le store). Ouverture protégée par mot de passe admin.
// ─────────────────────────────────────────────────────────────────────────────
const NB_LIGNES_GRILLE = 8 // lignes affichées (données + vides) — grille STCA

export function TypesVehiculeWindow(): JSX.Element {
  const [rows, setRows]   = useState<TypeVehicule[]>(() => getTypesVehicule())
  const [newType, setNew] = useState('')
  const [dirty, setDirty] = useState(false)

  const renumeroter = (list: TypeVehicule[]): TypeVehicule[] =>
    list.map((t, i) => ({ ...t, rang: i + 1 }))

  const marquer = (list: TypeVehicule[]): void => { setRows(renumeroter(list)); setDirty(true) }

  const renommer = (id: number, nom: string): void =>
    marquer(rows.map(t => t.id === id ? { ...t, nom } : t))

  const supprimer = (id: number): void => {
    if (rows.length <= 1) {
      notification.warning({ message: 'Au moins un type de véhicule est requis.', placement: 'bottomRight' })
      return
    }
    marquer(rows.filter(t => t.id !== id))
  }

  const deplacer = (index: number, sens: -1 | 1): void => {
    const cible = index + sens
    if (cible < 0 || cible >= rows.length) return
    const copie = [...rows]
    ;[copie[index], copie[cible]] = [copie[cible], copie[index]]
    marquer(copie)
  }

  const ajouter = (): void => {
    const nom = newType.trim()
    if (!nom) return
    if (rows.some(t => t.nom.toLowerCase() === nom.toLowerCase())) {
      notification.warning({ message: `Le type « ${nom} » existe déjà.`, placement: 'bottomRight' })
      return
    }
    const id = rows.reduce((m, t) => Math.max(m, t.id), 0) + 1
    marquer([...rows, { id, rang: rows.length + 1, nom }])
    setNew('')
  }

  const enregistrer = (): void => {
    const propres = rows.map(t => ({ ...t, nom: t.nom.trim() })).filter(t => t.nom !== '')
    if (propres.length === 0) {
      notification.error({ message: 'Aucun type valide à enregistrer.', placement: 'bottomRight' })
      return
    }
    const finaux = renumeroter(propres)
    setTypesVehicule(finaux)   // persiste + reconcilie Config. Assurances
    setRows(finaux)
    setDirty(false)
    notification.success({
      message: '✅ Types de véhicule enregistrés',
      description: `${finaux.length} type(s) — l'Enregistrement et Config. Assurances sont à jour.`,
      placement: 'bottomRight',
    })
  }

  const fermer = (): void => window.dispatchEvent(new CustomEvent('mdi:close-self'))

  // ── Styles table (modèle Config. Assurances) ───────────────────────────────
  // En-tête clair — même convention que nos autres tableaux (Liste, Archivage)
  const TH: React.CSSProperties = {
    background: '#EEF3FB', color: C.blue,
    fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
    padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #D9E2F0',
    whiteSpace: 'nowrap',
  }
  const TD: React.CSSProperties = { fontSize: 12, padding: '2px 8px', borderBottom: '1px solid #EEF2F7' }
  const cellInput: React.CSSProperties = {
    width: '100%', border: '1px solid transparent', background: 'transparent',
    fontSize: 12, fontWeight: 600, color: C.blue, padding: '3px 6px', borderRadius: 4, outline: 'none',
  }
  const miniBtn: React.CSSProperties = {
    width: 20, height: 14, lineHeight: '12px', textAlign: 'center', cursor: 'pointer',
    border: '1px solid #CBD5E1', background: '#fff', color: C.muted, borderRadius: 3, fontSize: 8, padding: 0,
  }
  const nbVides = Math.max(0, NB_LIGNES_GRILLE - rows.length)

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader icon={<CarOutlined />} title="Liste des Types de Véhicules (pour assurances)"
        subtitle="Types sélectionnés à l'enregistrement — pilotent aussi les catégories de Config. Assurances" />

      <div style={{ border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', marginBottom: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ ...TH, width: 104, textAlign: 'center' }}>Rang</th>
              <th style={TH}>Nom ou type de véhicule</th>
              <th style={{ ...TH, width: 96, textAlign: 'center' }}>&nbsp;</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t, i) => (
              <tr key={t.id} className={i % 2 ? 'table-row-alt' : ''}>
                <td style={{ ...TD, textAlign: 'center', width: 104 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.accent, minWidth: 14 }}>{t.rang}</span>
                    <span style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <button style={{ ...miniBtn, opacity: i === 0 ? 0.3 : 1 }} disabled={i === 0}
                        title="Monter" onClick={() => deplacer(i, -1)}>▲</button>
                      <button style={{ ...miniBtn, opacity: i === rows.length - 1 ? 0.3 : 1 }} disabled={i === rows.length - 1}
                        title="Descendre" onClick={() => deplacer(i, 1)}>▼</button>
                    </span>
                  </div>
                </td>
                <td style={TD}>
                  <input value={t.nom} style={cellInput}
                    onChange={e => renommer(t.id, e.target.value)}
                    onFocus={e => { e.currentTarget.style.border = `1px solid ${C.accent}`; e.currentTarget.style.background = '#fff' }}
                    onBlur={e => { e.currentTarget.style.border = '1px solid transparent'; e.currentTarget.style.background = 'transparent' }} />
                </td>
                <td style={{ ...TD, textAlign: 'center', width: 96 }}>
                  <Tooltip title="Supprimer ce type">
                    <button style={{ ...miniBtn, width: 24, height: 22, borderColor: '#FECACA', color: C.danger }}
                      onClick={() => supprimer(t.id)}>🗑</button>
                  </Tooltip>
                </td>
              </tr>
            ))}
            {Array.from({ length: nbVides }, (_, i) => (
              <tr key={`vide-${i}`}>
                <td style={{ ...TD, height: 30 }}>&nbsp;</td>
                <td style={TD}>&nbsp;</td>
                <td style={TD}>&nbsp;</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ajout d'un nouveau type */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}>
        <Input value={newType} onChange={e => setNew(e.target.value)} onPressEnter={ajouter}
          placeholder="Nouveau type de véhicule…" style={{ flex: 1 }} size="small" allowClear />
        <Button icon={<PlusOutlined />} onClick={ajouter} disabled={!newType.trim()} size="small">Ajouter</Button>
      </div>

      {/* Boutons bas — Enregistrer + Fermer (fidèle : Fermer centré) */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
        <Button type="primary" icon={<SaveOutlined />} onClick={enregistrer} disabled={!dirty}
          style={{ background: dirty ? C.green : undefined, borderColor: dirty ? C.green : undefined }}>
          Enregistrer
        </Button>
        <Button icon={<CheckOutlined />} onClick={fermer}>Fermer</Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES DESTINATIONS — fidèle aux captures STCA (22/07/2026) : liste
// Code Destination | Tarif | Destination | Lettre | N° immatriculation, boutons
// Nouveau / Modifier / Supprimer / Imprimer / Fermer. NOUVEAU dans TCIT : une
// colonne COULEUR (couleur de la plaque pré-imprimée liée à la destination),
// éditable dans le formulaire — source unique (destinationsStore) qui pilote
// toutes les pastilles de l'app. Nouveau/Modifier ouvrent la fenêtre
// indépendante edition.destination (Règle 10). Ouverture protégée admin.
// En-tête de tableau clair — convention maison (cf. Liste, Types Véhicule).
// ─────────────────────────────────────────────────────────────────────────────
export function ParamDestinationsWindow(): JSX.Element {
  const dests = useDestinations()
  const [selCode, setSelCode] = useState<string | null>(dests[0]?.code ?? null)

  const countByDest = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of mockVehicules) m.set(v.destination, (m.get(v.destination) ?? 0) + 1)
    return m
  }, [])

  const ouvrirEdition = (dest: DestinationParam | null): void => {
    localStorage.setItem('tcit_edition_destination', JSON.stringify({ destination: dest, ts: Date.now() }))
    const c = WINDOW_REGISTRY['edition.destination']
    if (c) electronApi.mdiOpen({ id: 'edition.destination', x: c.defaultX, y: c.defaultY, width: c.width, height: c.height })
  }

  const ouvrirModif = (): void => {
    const d = dests.find(x => x.code === selCode)
    if (!d) { notification.info({ message: 'Sélectionnez d’abord une destination.', placement: 'bottomRight' }); return }
    ouvrirEdition(JSON.parse(JSON.stringify(d)) as DestinationParam)
  }

  const supprimer = (): void => {
    const d = dests.find(x => x.code === selCode)
    if (!d) { notification.info({ message: 'Sélectionnez d’abord une destination.', placement: 'bottomRight' }); return }
    if ((countByDest.get(d.code) ?? 0) > 0) {
      notification.warning({ message: `« ${d.code} » a des véhicules enregistrés — suppression bloquée.`, placement: 'bottomRight' })
      return
    }
    Modal.confirm({
      title: 'Supprimer cette destination ?',
      content: `« ${d.code} — ${d.nom} » sera retirée des paramètres de destination.`,
      okText: 'Supprimer', okType: 'danger', cancelText: 'Annuler',
      onOk: () => {
        removeDestination(d.code)
        notification.success({ message: `Destination « ${d.code} » supprimée.`, placement: 'bottomRight' })
      },
    })
  }

  const imprimer = (): void => {
    const c = WINDOW_REGISTRY['apercu.listeDestinations']
    if (c) electronApi.mdiOpen({ id: 'apercu.listeDestinations', x: c.defaultX, y: c.defaultY, width: c.width, height: c.height })
  }

  // ── Styles (en-tête clair maison + boutons droits comme Config. Assurances) ──
  const TH: React.CSSProperties = {
    background: '#EEF3FB', color: C.blue,
    fontSize: 10, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase',
    padding: '8px 10px', textAlign: 'left', borderBottom: '2px solid #D9E2F0', whiteSpace: 'nowrap',
  }
  const TD: React.CSSProperties = { fontSize: 12, padding: '5px 10px', borderBottom: '1px solid #EEF2F7' }
  const btnDroit: React.CSSProperties = {
    width: '100%', padding: '8px 6px', fontSize: 11.5, borderRadius: 5, cursor: 'pointer',
    border: '1px solid #CBD5E1', background: '#fff', color: '#1E293B', fontWeight: 600,
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  }
  const nbVides = Math.max(0, 12 - dests.length)

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader icon={<EnvironmentOutlined />} title="Liste des destinations"
        subtitle="Bureaux frontière — tarif, lettre, n° d'immatriculation et couleur de plaque pré-imprimée" />

      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, border: '1px solid #CBD5E1', borderRadius: 6, overflow: 'hidden', alignSelf: 'flex-start' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ ...TH, width: 66, textAlign: 'center' }}>Couleur</th>
                <th style={{ ...TH, width: 68 }}>Code</th>
                <th style={{ ...TH, width: 84, textAlign: 'right' }}>Tarif</th>
                <th style={TH}>Destination</th>
                <th style={{ ...TH, width: 56, textAlign: 'center' }}>Lettre</th>
                <th style={{ ...TH, width: 92, textAlign: 'right' }}>N° immat.</th>
              </tr>
            </thead>
            <tbody>
              {dests.map((d, i) => {
                const sel = d.code === selCode
                return (
                  <tr key={d.code} onClick={() => setSelCode(d.code)} onDoubleClick={() => { setSelCode(d.code); ouvrirEdition(JSON.parse(JSON.stringify(d)) as DestinationParam) }}
                    className={!sel && i % 2 ? 'table-row-alt' : ''}
                    style={{ cursor: 'pointer', background: sel ? '#DBEAFE' : undefined }}>
                    <td style={{ ...TD, textAlign: 'center' }}>
                      <span title={d.couleur} style={{
                        display: 'inline-block', width: 18, height: 18, borderRadius: 4,
                        background: d.couleur, border: '1px solid rgba(0,0,0,0.2)', verticalAlign: 'middle',
                      }} />
                    </td>
                    <td style={{ ...TD, fontWeight: 700, color: C.blue }}>{d.code}</td>
                    <td style={{ ...TD, textAlign: 'right', color: C.green, fontWeight: 600 }}>{d.tarif.toLocaleString('fr-FR')}</td>
                    <td style={{ ...TD, color: '#1E293B' }}>{d.nom}</td>
                    <td style={{ ...TD, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, color: C.accent }}>{d.lettre}</td>
                    <td style={{ ...TD, textAlign: 'right', fontFamily: 'monospace', color: C.muted }}>{String(d.numImmatActuel).padStart(4, '0')}</td>
                  </tr>
                )
              })}
              {Array.from({ length: nbVides }, (_, i) => (
                <tr key={`vide-${i}`}>
                  <td style={{ ...TD, height: 28 }}>&nbsp;</td>
                  <td style={TD}>&nbsp;</td><td style={TD}>&nbsp;</td>
                  <td style={TD}>&nbsp;</td><td style={TD}>&nbsp;</td><td style={TD}>&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{ width: 140, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button style={btnDroit} onClick={() => ouvrirEdition(null)}><PlusOutlined /> Nouveau</button>
          <button style={btnDroit} onClick={ouvrirModif}><EditOutlined /> Modifier</button>
          <button style={{ ...btnDroit, border: '1px solid #FECACA', color: C.danger }} onClick={supprimer}><DeleteOutlined /> Supprimer</button>
          <button style={{ ...btnDroit, marginTop: 20 }} onClick={imprimer}><PrinterOutlined /> Imprimer</button>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))}
            style={{ ...btnDroit, marginTop: 'auto', border: '1px solid #FECACA', background: '#FFF5F5', color: C.danger, fontWeight: 700 }}>
            Fermer ⊗
          </button>
        </div>
      </div>
    </div>
  )
}
