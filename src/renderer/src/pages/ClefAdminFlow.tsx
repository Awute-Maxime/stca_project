import { useState } from 'react'
import { notification } from 'antd'
import { estMdpAdminValide, setMdpForcage } from '@mock/adminConfig'

// ─────────────────────────────────────────────────────────────────────────────
// Clef d'administration (menu Outils+Config.) — flux fidèle au vrai STCA II :
// 1. « Saisie 'Mot de passe' de Configuration » : mot de passe admin requis
//    (forçage configuré OU compte administrateur actif) + option Lire Clé USB.
// 2. « Configuration 'Mots de passe' Administrateur » : définit le mot de
//    passe de forçage (persisté) + option Écrire Clé USB pour créer la clé
//    d'administration des utilisateurs non techniques.
// Overlay sur MainScreen (Règle 17 — fonctions protégées par mot de passe).
// ─────────────────────────────────────────────────────────────────────────────

export default function ClefAdminFlow({ onClose }: { onClose: () => void }): JSX.Element {
  const [step, setStep] = useState<'saisie' | 'config'>('saisie')
  const [mdp, setMdp] = useState('')
  const [nouveauMdp, setNouveauMdp] = useState('')
  const [erreur, setErreur] = useState<string | null>(null)

  const validerSaisie = (): void => {
    if (estMdpAdminValide(mdp)) {
      setErreur(null)
      setStep('config')
    } else {
      setErreur('Mot de passe incorrect.')
      setMdp('')
    }
  }

  const validerConfig = (): void => {
    if (!nouveauMdp.trim()) {
      setErreur('Saisissez le nouveau mot de passe de forçage.')
      return
    }
    setMdpForcage(nouveauMdp.trim())
    notification.success({
      message: '🔑 Mot de passe de forçage enregistré',
      description: "Il donne désormais accès aux fonctions d'Administrateur de TCIT.",
      placement: 'bottomRight',
    })
    onClose()
  }

  const lireCleUsb = (): void => {
    notification.info({ message: '🔌 Lecture de la clé USB…', description: 'Aucune clé d\'administration détectée (matériel non branché).', placement: 'bottomRight' })
  }

  const ecrireCleUsb = (): void => {
    notification.info({ message: '🔌 Écriture sur la clé USB…', description: 'Insérez une clé USB pour créer la clé d\'administration (matériel non branché).', placement: 'bottomRight' })
  }

  // ── Styles communs (pattern des modaux mot de passe validés) ──────────────
  const OV: React.CSSProperties = {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  }
  const carte: React.CSSProperties = {
    background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)', width: 470, padding: 0,
    animation: 'formEnter 0.2s ease',
  }
  const titre: React.CSSProperties = {
    display: 'flex', alignItems: 'center', padding: '14px 20px',
    borderBottom: '1px solid #E2E8F0', background: '#1B3A6B', borderRadius: '10px 10px 0 0',
  }
  const fermerBtn: React.CSSProperties = {
    width: 26, height: 26, background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)',
    cursor: 'pointer', fontSize: 17, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4,
  }
  const okBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 5, padding: '5px 16px',
    background: '#2563EB', color: '#fff', border: 'none', borderRadius: 5,
    fontSize: 12, fontWeight: 600, cursor: 'pointer',
  }
  const usbBtn: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 16px',
    background: '#F1F5F9', color: '#475569', border: '1px solid #CBD5E1',
    borderRadius: 5, fontSize: 12, cursor: 'pointer',
  }
  const annulerBtn: React.CSSProperties = {
    height: 34, padding: '0 16px', background: '#fff', color: '#374151',
    border: '1px solid #D1D5DB', borderRadius: 5, fontSize: 12, cursor: 'pointer',
  }
  const champ: React.CSSProperties = { width: 130, padding: '4px 8px', fontSize: 13, height: 26 }

  // ── Étape 1 : Saisie 'Mot de passe' de Configuration ─────────────────────
  if (step === 'saisie') {
    return (
      <div style={OV}>
        <div style={carte}>
          <div style={titre}>
            <span style={{ fontSize: 12, marginRight: 8 }}>🔒</span>
            <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Saisie &apos;Mot de passe&apos; de Configuration</span>
            <button style={fermerBtn} onClick={onClose}>✕</button>
          </div>

          <div style={{ padding: '20px 24px' }}>
            <div style={{
              border: '1px solid #E2E8F0', background: '#F8FAFF',
              borderRadius: 6, padding: '14px 16px', marginBottom: 16,
            }}>
              <p style={{ color: '#DC2626', fontSize: 11.5, margin: '0 0 14px', lineHeight: 1.5 }}>
                Donnez le mot de passe de forçage pour accéder aux fonctions d&apos;Administrateur de TCIT.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label style={{ fontSize: 11.5, whiteSpace: 'nowrap', color: '#374151', fontWeight: 700 }}>» Mot de passe Admin. :</label>
                <input type="password" className="light-input" value={mdp}
                  onChange={e => { setMdp(e.target.value); setErreur(null) }}
                  onKeyDown={e => { if (e.key === 'Enter') validerSaisie() }}
                  autoFocus
                  style={champ} />
                <button style={okBtn} onClick={validerSaisie}>OK ✔</button>
              </div>
              {erreur && (
                <div style={{ marginTop: 10, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>⚠ {erreur}</div>
              )}
            </div>

            <div style={{ textAlign: 'center', borderTop: '1px solid #E2E8F0', paddingTop: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>⚠️</span>
                <span style={{ fontSize: 11.5, color: '#92400E', fontWeight: 600 }}>Ou déverrouiller par la clé USB :</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
                <button style={usbBtn} onClick={lireCleUsb}>🔌 Lire Clé USB</button>
                <button style={annulerBtn} onClick={onClose}>Annuler 🚫</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ── Étape 2 : Configuration 'Mots de passe' Administrateur ───────────────
  return (
    <div style={OV}>
      <div style={carte}>
        <div style={titre}>
          <span style={{ fontSize: 12, marginRight: 8 }}>🔑</span>
          <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#fff' }}>Configuration &apos;Mots de passe&apos; Administrateur</span>
          <button style={fermerBtn} onClick={onClose}>✕</button>
        </div>

        <div style={{ padding: '20px 24px' }}>
          <div style={{
            border: '1px solid #E2E8F0', background: '#F8FAFF',
            borderRadius: 6, padding: '14px 16px', marginBottom: 16,
          }}>
            <p style={{ color: '#1E293B', fontSize: 11.5, margin: '0 0 14px', lineHeight: 1.5 }}>
              Permet de configurer le mot de passe de forçage pour les fonctions d&apos;Administrateur de TCIT.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 12, whiteSpace: 'nowrap', color: '#1E293B', fontWeight: 700 }}>» Mot de passe Admin. :</label>
              <input type="password" className="light-input" value={nouveauMdp}
                onChange={e => { setNouveauMdp(e.target.value); setErreur(null) }}
                onKeyDown={e => { if (e.key === 'Enter') validerConfig() }}
                autoFocus
                style={{ ...champ, width: 150 }} />
            </div>
            {erreur && (
              <div style={{ marginTop: 10, fontSize: 11, color: '#DC2626', fontWeight: 600 }}>⚠ {erreur}</div>
            )}
          </div>

          <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1 }} />
            <button style={usbBtn} onClick={ecrireCleUsb}>🔌 Ecrire Clé USB</button>
            <button style={okBtn} onClick={validerConfig}>OK ✔</button>
            <button style={annulerBtn} onClick={onClose}>Annuler 🚫</button>
          </div>
        </div>
      </div>
    </div>
  )
}
