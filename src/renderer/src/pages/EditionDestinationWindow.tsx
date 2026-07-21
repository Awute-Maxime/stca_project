import { useState } from 'react'
import { notification } from 'antd'
import { EnvironmentOutlined } from '@ant-design/icons'
import {
  upsertDestination, getDestinations,
  PALETTE_PLAQUES, COULEUR_FALLBACK, type DestinationParam,
} from '@mock/destinationsStore'

// ─────────────────────────────────────────────────────────────────────────────
// Saisie des paramètres de destination — fenêtre INDÉPENDANTE (Règle 10),
// ouverte par Paramètres Destinations pour « Nouveau » ou « Modifier ». Fidèle
// à la capture STCA (Code destination, Tarif, Destination, Lettre, N°
// Immatriculation) + NOUVEAU : la COULEUR de la plaque pré-imprimée (palette de
// couleurs standard + couleur personnalisée). Payload localStorage
// 'tcit_edition_destination' ; Valider → destinationsStore → la liste se
// synchronise seule ; auto-fermeture.
// ─────────────────────────────────────────────────────────────────────────────

const C = { blue: '#1B3A6B', accent: '#2563EB', green: '#16A34A', danger: '#DC2626', muted: '#64748B' }

function chargerPayload(): { destination: DestinationParam | null } {
  try {
    const raw = localStorage.getItem('tcit_edition_destination')
    if (raw) return JSON.parse(raw) as { destination: DestinationParam | null }
  } catch { /* nouveau */ }
  return { destination: null }
}

export default function EditionDestinationWindow(): JSX.Element {
  const [payload] = useState(chargerPayload)
  const dest = payload.destination
  const estNouveau = dest === null

  const [code,     setCode]     = useState(dest?.code ?? '')
  const [tarif,    setTarif]    = useState<number>(dest?.tarif ?? 0)
  const [nom,      setNom]      = useState(dest?.nom ?? '')
  const [lettre,   setLettre]   = useState(dest?.lettre ?? '')
  const [numImmat, setNumImmat] = useState<number>(dest?.numImmatActuel ?? 0)
  const [couleur,  setCouleur]  = useState(dest?.couleur ?? COULEUR_FALLBACK)

  const valider = (): void => {
    const codeT = code.trim().toUpperCase()
    if (!codeT) { notification.error({ message: 'Le code destination est obligatoire.', placement: 'bottomRight' }); return }
    if (!nom.trim()) { notification.error({ message: 'Le nom de la destination est obligatoire.', placement: 'bottomRight' }); return }
    // En création, refuser un code déjà pris
    if (estNouveau && getDestinations().some(d => d.code.toLowerCase() === codeT.toLowerCase())) {
      notification.error({ message: `Le code « ${codeT} » existe déjà.`, placement: 'bottomRight' })
      return
    }
    upsertDestination({
      code: codeT,
      tarif: tarif || 0,
      nom: nom.trim(),
      lettre: lettre.trim().toUpperCase().slice(0, 2),
      numImmatActuel: numImmat || 0,
      couleur,
    })
    notification.success({
      message: estNouveau ? '✅ Destination créée' : '✅ Destination modifiée',
      description: `${codeT} — ${nom.trim()} · plaque ${couleur}`,
      placement: 'bottomRight',
    })
    setTimeout(() => window.dispatchEvent(new CustomEvent('mdi:close-self')), 350)
  }

  const fermer = (): void => window.dispatchEvent(new CustomEvent('mdi:close-self'))

  // ── Styles ──────────────────────────────────────────────────────────────────
  const label: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 4, display: 'block' }
  const champ: React.CSSProperties = {
    width: '100%', height: 34, padding: '0 10px', fontSize: 13, borderRadius: 6,
    border: '1px solid #CBD5E1', outline: 'none', color: '#1E293B', boxSizing: 'border-box',
  }
  const estPerso = !PALETTE_PLAQUES.some(p => p.hex.toLowerCase() === couleur.toLowerCase())

  return (
    <div style={{ animation: 'formEnter 0.3s ease', padding: 4 }}>
      {/* Sub-header beige (modèle validé) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 14, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <EnvironmentOutlined style={{ color: C.blue, fontSize: 15 }} />
        <span style={{ color: C.blue, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Saisie des paramètres de destination
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 6px' }}>
        {/* Code + Tarif */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 150 }}>
            <label style={label}>Code destination</label>
            <input style={{ ...champ, fontWeight: 700, textTransform: 'uppercase' }} value={code}
              onChange={e => setCode(e.target.value)} maxLength={5} autoFocus placeholder="ex. AFO" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>Tarif (F CFA)</label>
            <input style={{ ...champ, textAlign: 'right', color: C.green, fontWeight: 700 }} type="number"
              value={tarif} onChange={e => setTarif(Number(e.target.value))} min={0} step={500} />
          </div>
        </div>

        {/* Destination */}
        <div>
          <label style={label}>Destination</label>
          <input style={champ} value={nom} onChange={e => setNom(e.target.value)} placeholder="Nom de la frontière" />
        </div>

        {/* Lettre + N° Immatriculation */}
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ width: 110 }}>
            <label style={label}>Lettre</label>
            <input style={{ ...champ, textAlign: 'center', fontFamily: 'monospace', fontWeight: 700, textTransform: 'uppercase' }}
              value={lettre} onChange={e => setLettre(e.target.value)} maxLength={2} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={label}>N° Immatriculation</label>
            <input style={{ ...champ, textAlign: 'right', fontFamily: 'monospace' }} type="number"
              value={numImmat} onChange={e => setNumImmat(Number(e.target.value))} min={0} />
          </div>
        </div>

        {/* Couleur de la plaque pré-imprimée */}
        <div style={{ border: '1px solid #BFDBFE', background: '#F8FBFF', borderRadius: 8, padding: '10px 12px' }}>
          <label style={{ ...label, marginBottom: 8 }}>
            Couleur de la plaque pré-imprimée
            <span style={{ fontWeight: 400, color: C.muted, marginLeft: 6 }}>— liée à cette destination</span>
          </label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            {PALETTE_PLAQUES.map(p => {
              const actif = p.hex.toLowerCase() === couleur.toLowerCase()
              return (
                <button key={p.hex} title={p.nom} onClick={() => setCouleur(p.hex)}
                  style={{
                    width: 30, height: 30, borderRadius: 6, cursor: 'pointer', background: p.hex,
                    border: actif ? '3px solid #1E293B' : '1px solid rgba(0,0,0,0.2)',
                    boxShadow: actif ? '0 0 0 2px #fff inset' : undefined,
                  }} />
              )
            })}
            {/* Couleur personnalisée */}
            <label title="Couleur personnalisée" style={{
              display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, cursor: 'pointer',
              border: estPerso ? '2px solid #1E293B' : '1px dashed #94A3B8', borderRadius: 6, padding: '3px 8px',
            }}>
              <input type="color" value={couleur} onChange={e => setCouleur(e.target.value)}
                style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>Perso</span>
            </label>
            <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ display: 'inline-block', width: 22, height: 22, borderRadius: 4, background: couleur, border: '1px solid rgba(0,0,0,0.25)' }} />
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: C.blue }}>{couleur.toUpperCase()}</span>
            </span>
          </div>
        </div>

        {/* Boutons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 6 }}>
          <button onClick={valider} style={{
            height: 36, padding: '0 26px', borderRadius: 6, cursor: 'pointer', border: 'none',
            background: C.green, color: '#fff', fontSize: 13, fontWeight: 700,
          }}>✓ Valider</button>
          <button onClick={fermer} style={{
            height: 36, padding: '0 22px', borderRadius: 6, cursor: 'pointer',
            border: '1px solid #CBD5E1', background: '#fff', color: '#1E293B', fontSize: 13, fontWeight: 600,
          }}>Fermer</button>
        </div>
      </div>
    </div>
  )
}
