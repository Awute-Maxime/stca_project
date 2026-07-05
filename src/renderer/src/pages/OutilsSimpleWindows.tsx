import { useState } from 'react'
import { Input, Button, Radio, Alert, Divider } from 'antd'
import {
  LockOutlined, CheckCircleOutlined, WarningOutlined,
  NumberOutlined, ToolOutlined,
} from '@ant-design/icons'

// ── Palette commune ───────────────────────────────────────────────────────────
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
      padding: '10px 14px', marginBottom: 14, borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ color: '#1B3A6B', fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ color: '#1B3A6B', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && <div style={{ color: '#64748B', fontSize: 10, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }): JSX.Element {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: `1px solid ${C.border}`, fontSize: 12 }}>
      <span style={{ color: C.muted }}>{label}</span>
      <span style={{ fontWeight: 600, color: C.blue, fontFamily: mono ? 'Courier New, monospace' : undefined }}>{value}</span>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// CLEF D'ADMINISTRATION
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_KEY = 'TCIT2024'

export function ClefAdminWindow(): JSX.Element {
  const [key,        setKey]        = useState('')
  const [status,     setStatus]     = useState<'idle' | 'ok' | 'error'>('idle')
  const [showKey,    setShowKey]    = useState(false)
  const [attempts,   setAttempts]   = useState(0)
  const locked = attempts >= 3

  const handleValidate = (): void => {
    if (key === ADMIN_KEY) {
      setStatus('ok')
    } else {
      setAttempts(a => a + 1)
      setStatus('error')
      setKey('')
    }
  }

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader
        icon={<LockOutlined />}
        title="CLEF D'ADMINISTRATION"
        subtitle="Accès restreint aux fonctions de maintenance"
      />

      {status !== 'ok' ? (
        <div style={{ maxWidth: 380, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%', margin: '0 auto 12px',
              background: locked ? '#FEF2F2' : C.bg,
              border: `2px solid ${locked ? '#FECACA' : '#DDEAFF'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LockOutlined style={{ fontSize: 26, color: locked ? C.danger : C.blue }} />
            </div>
            <div style={{ fontSize: 12, color: C.muted }}>
              Saisissez la clef d'administration pour accéder aux fonctions de maintenance du système.
            </div>
          </div>

          {locked ? (
            <Alert type="error" icon={<WarningOutlined />} showIcon
              message="Accès bloqué"
              description="Trop de tentatives incorrectes. Redémarrez l'application ou contactez l'administrateur."
              style={{ marginBottom: 12 }} />
          ) : (
            <>
              {status === 'error' && (
                <Alert type="warning" showIcon
                  message={`Clef incorrecte (${attempts}/3 tentative${attempts > 1 ? 's' : ''})`}
                  style={{ marginBottom: 10, fontSize: 11 }} />
              )}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
                  Clef d'administration
                </div>
                <Input.Password
                  value={key}
                  onChange={e => setKey(e.target.value.toUpperCase())}
                  onPressEnter={handleValidate}
                  placeholder="Saisir la clef…"
                  size="large"
                  style={{ fontFamily: 'Courier New, monospace', letterSpacing: 2 }}
                  autoFocus
                  visibilityToggle={{ visible: showKey, onVisibleChange: setShowKey }}
                />
              </div>
              <Button
                type="primary" size="large" block
                onClick={handleValidate} disabled={!key}
                style={{ background: C.blue, borderColor: C.blue }}>
                Valider
              </Button>
            </>
          )}
        </div>
      ) : (
        <div style={{ animation: 'formEnter 0.3s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, padding: '8px 12px', background: '#F0FDF4', borderRadius: 6, border: '1px solid #BBF7D0' }}>
            <CheckCircleOutlined style={{ color: C.green, fontSize: 16 }} />
            <span style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>Accès administrateur accordé</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Réinitialiser compteurs IMMAT', icon: '🔄', color: C.accent },
              { label: 'Purger les archives anciennes', icon: '🗑️', color: '#D97706' },
              { label: 'Recompacter la base de données', icon: '🗜️', color: C.blue },
              { label: 'Exporter la configuration', icon: '📤', color: C.green },
              { label: 'Réinitialiser les mots de passe', icon: '🔑', color: '#7C3AED' },
              { label: 'Journal des erreurs système', icon: '📋', color: C.muted },
            ].map(action => (
              <button key={action.label} style={{
                padding: '10px 12px', border: `1px solid ${C.border}`, borderRadius: 6,
                background: '#fff', cursor: 'pointer', textAlign: 'left', fontSize: 11,
                color: C.blue, fontWeight: 500, transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
                onMouseEnter={e => { e.currentTarget.style.background = C.bg; e.currentTarget.style.borderColor = C.accent }}
                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = C.border }}>
                <span style={{ fontSize: 14 }}>{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FIXER N° RÉFÉRENCE
// ─────────────────────────────────────────────────────────────────────────────
export function FixerRefWindow(): JSX.Element {
  const currentRef = 10053
  const [newRef, setNewRef] = useState(String(currentRef))
  const [saved,  setSaved]  = useState(false)

  const numVal  = parseInt(newRef, 10)
  const isValid = !isNaN(numVal) && numVal > 0 && numVal <= 999999
  const isDown  = isValid && numVal < currentRef

  const handleApply = (): void => {
    if (!isValid) return
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader
        icon={<NumberOutlined />}
        title="FIXER LE N° DE RÉFÉRENCE"
        subtitle="Définir le numéro de départ pour les prochains enregistrements"
      />

      <div style={{ background: C.bg, border: `1px solid #DDEAFF`, borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
        <InfoRow label="Référence actuelle" value={String(currentRef).padStart(6, '0')} mono />
        <InfoRow label="Prochain enregistrement" value={String(currentRef + 1).padStart(6, '0')} mono />
        <div style={{ borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', fontSize: 12 }}>
          <span style={{ color: C.muted }}>Total enregistrements</span>
          <span style={{ fontWeight: 600, color: C.blue }}>52 enregistrements</span>
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
          Nouveau numéro de référence
        </div>
        <Input
          value={newRef}
          onChange={e => { setNewRef(e.target.value); setSaved(false) }}
          style={{ fontFamily: 'Courier New, monospace', letterSpacing: 2, fontSize: 16, fontWeight: 700 }}
          size="large"
          status={newRef && !isValid ? 'error' : undefined}
          maxLength={6}
        />
      </div>

      {isDown && (
        <Alert type="warning" showIcon icon={<WarningOutlined />}
          message="Attention : numéro inférieur à la référence actuelle"
          description="Réduire le compteur peut générer des doublons dans les enregistrements existants."
          style={{ marginBottom: 10, fontSize: 11 }} />
      )}

      {saved && (
        <Alert type="success" showIcon icon={<CheckCircleOutlined />}
          message={`Référence mise à jour → ${String(numVal).padStart(6, '0')}`}
          style={{ marginBottom: 10, fontSize: 11 }} />
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={() => setNewRef(String(currentRef))}>Annuler</Button>
        <Button type="primary" onClick={handleApply} disabled={!isValid || saved}
          style={{ background: C.blue, borderColor: C.blue }}>
          Appliquer
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVATION MODE ASSURANCE (POSTE IMMAT)
// ─────────────────────────────────────────────────────────────────────────────
export function PosteImmatWindow(): JSX.Element {
  const [mode,  setMode]  = useState<'standard' | 'assurance'>('standard')
  const [saved, setSaved] = useState(false)

  const handleSave = (): void => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader
        icon={<ToolOutlined />}
        title="ACTIVATION DU MODE ASSURANCE"
        subtitle="Configurer le mode de fonctionnement de ce poste"
      />

      <div style={{ marginBottom: 14 }}>
        <Radio.Group value={mode} onChange={e => { setMode(e.target.value); setSaved(false) }}
          style={{ width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
              border: `2px solid ${mode === 'standard' ? C.accent : C.border}`,
              borderRadius: 8, cursor: 'pointer', background: mode === 'standard' ? C.bg : '#fff',
              transition: 'all 0.2s',
            }}>
              <Radio value="standard" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 3 }}>
                  Mode Standard
                </div>
                <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>
                  Enregistrement classique des véhicules en transit. Les montants sont fixes à 10 000 FCFA par véhicule.
                  Aucune gestion d'assurance activée sur ce poste.
                </div>
              </div>
            </label>

            <label style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
              border: `2px solid ${mode === 'assurance' ? C.gold : C.border}`,
              borderRadius: 8, cursor: 'pointer', background: mode === 'assurance' ? '#FFFBEB' : '#fff',
              transition: 'all 0.2s',
            }}>
              <Radio value="assurance" style={{ marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#92400E', marginBottom: 3 }}>
                  Mode Assurance
                </div>
                <div style={{ fontSize: 11, color: '#78350F', lineHeight: 1.5 }}>
                  Active la collecte des primes d'assurance en plus du droit de transit.
                  Les montants varient selon le type de véhicule. Nécessite la clef d'administration.
                </div>
              </div>
            </label>
          </div>
        </Radio.Group>
      </div>

      <Divider style={{ margin: '10px 0' }} />

      <div style={{ background: C.bg, border: `1px solid #DDEAFF`, borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
        <InfoRow label="Mode actuel" value={<span style={{ color: C.green }}>● Standard</span>} />
        <InfoRow label="Poste" value="TCIT-POSTE-4B2F" mono />
        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', fontSize: 12 }}>
          <span style={{ color: C.muted }}>Dernière modification</span>
          <span style={{ color: C.muted, fontSize: 11 }}>07/06/2026 — awute</span>
        </div>
      </div>

      {saved && (
        <Alert type="success" showIcon icon={<CheckCircleOutlined />}
          message={`Mode ${mode === 'standard' ? 'Standard' : 'Assurance'} activé avec succès`}
          style={{ marginBottom: 10, fontSize: 11 }} />
      )}

      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button onClick={() => setMode('standard')}>Réinitialiser</Button>
        <Button type="primary" onClick={handleSave}
          style={{ background: mode === 'assurance' ? '#D97706' : C.blue, borderColor: mode === 'assurance' ? '#D97706' : C.blue }}>
          Enregistrer
        </Button>
      </div>
    </div>
  )
}
