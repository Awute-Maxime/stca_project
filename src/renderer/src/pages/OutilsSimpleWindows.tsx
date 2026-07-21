import { useState, useMemo } from 'react'
import { Input, Button, Radio, Alert, Divider, notification } from 'antd'
import {
  LockOutlined, CheckCircleOutlined, WarningOutlined,
  NumberOutlined, ToolOutlined,
} from '@ant-design/icons'
import { getAllVehicules, getRefCompteur, setRefCompteur } from '@mock/vehiculesStore'
import { getAllArchives } from '@mock/archivesStore'

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
// FIXER N° RÉFÉRENCE
// ─────────────────────────────────────────────────────────────────────────────
const fmtRef = (n: number): string => String(n).padStart(6, '0')

export function FixerRefWindow(): JSX.Element {
  const [compteur, setCompteur] = useState(getRefCompteur)
  const [saisie, setSaisie] = useState(() => String(getRefCompteur()))

  // Photo de la base : actifs + ARCHIVÉS (une référence archivée reste prise !)
  const base = useMemo(() => {
    const actifs = getAllVehicules()
    const archives = getAllArchives()
    const refs = [...actifs, ...archives]
      .map(v => parseInt(v.ref, 10))
      .filter(n => !isNaN(n))
    return {
      refs,
      max: refs.reduce((m, n) => Math.max(m, n), 0),
      nbActifs: actifs.length,
      nbArchives: archives.length,
    }
  }, [compteur])

  const val = parseInt(saisie, 10)
  const valide = /^\d+$/.test(saisie.trim()) && !isNaN(val) && val >= 0 && val <= 999999

  // ── CONTRÔLE AUTOMATIQUE (ce que le vrai STCA demande de faire à la main) ──
  // Toute référence existante SUPÉRIEURE au compteur sera ré-attribuée par les
  // prochains enregistrements → doublon. On les détecte et on bloque.
  const collisions = valide ? base.refs.filter(n => n > val).sort((a, b) => a - b) : []
  const bloque = valide && collisions.length > 0
  const ecart = valide ? val - base.max : 0
  const prochain = valide ? Math.max(val, base.max) + 1 : base.max + 1

  const valider = (): void => {
    if (!valide || bloque) return
    setRefCompteur(val)
    setCompteur(val)
    notification.success({
      message: '✅ N° de référence fixé',
      description: `Compteur = ${fmtRef(val)} · prochain enregistrement : ${fmtRef(val + 1)}`,
      placement: 'bottomRight',
    })
  }

  const fermer = (): void => window.dispatchEvent(new CustomEvent('mdi:close-self'))

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader
        icon={<NumberOutlined />}
        title="FIXER LE N° DE RÉFÉRENCE"
        subtitle="Compteur des références d'enregistrement — outil de réparation (restauration, migration)"
      />

      {/* Avertissement du vrai STCA — mais ici TCIT fait le contrôle lui-même */}
      <div style={{
        background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8,
        padding: '9px 12px', marginBottom: 12, display: 'flex', gap: 8, alignItems: 'flex-start',
      }}>
        <WarningOutlined style={{ color: C.danger, fontSize: 15, marginTop: 1 }} />
        <div style={{ fontSize: 11.5, color: '#991B1B', lineHeight: 1.45 }}>
          <strong>Attention ! Contrôler la table « enregistrement » avant de modifier ce N° !</strong>
          <div style={{ color: '#7F1D1D', marginTop: 2 }}>
            TCIT effectue ce contrôle automatiquement ci-dessous : toute valeur qui
            écraserait des références existantes est refusée.
          </div>
        </div>
      </div>

      <div style={{ background: C.bg, border: '1px solid #DDEAFF', borderRadius: 8, padding: '10px 14px', marginBottom: 12 }}>
        <InfoRow label="N° de référence en cours" value={fmtRef(compteur)} mono />
        <InfoRow label="N° le plus élevé réellement utilisé" value={fmtRef(base.max)} mono />
        <div style={{ borderBottom: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', fontSize: 12 }}>
          <span style={{ color: C.muted }}>Enregistrements contrôlés</span>
          <span style={{ fontWeight: 600, color: C.blue }}>
            {base.nbActifs} actif(s) + {base.nbArchives} archivé(s)
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 9, color: C.muted, marginBottom: 4, letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>
          N° de référence en cours … :
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' }}>
          <Input
            value={saisie}
            onChange={e => setSaisie(e.target.value)}
            style={{ flex: 1, fontFamily: 'Courier New, monospace', letterSpacing: 2, fontSize: 16, fontWeight: 700, textAlign: 'center' }}
            size="large"
            status={saisie && (!valide || bloque) ? 'error' : undefined}
            maxLength={6}
            autoFocus
          />
          <Button
            size="large"
            onClick={() => setSaisie(String(base.max))}
            disabled={valide && val === base.max}
            title="Caler le compteur sur la dernière référence réellement utilisée (actifs + archivés)"
          >
            ↺ Réaligner
          </Button>
        </div>
        {compteur < base.max && (
          <div style={{
            marginTop: 8, padding: '7px 10px', borderRadius: 6,
            background: '#FFFBEB', border: '1px solid #FDE68A',
            fontSize: 11, color: '#92400E', lineHeight: 1.45,
          }}>
            ⚠ Le compteur enregistré (<strong>{fmtRef(compteur)}</strong>) est <strong>en retard</strong> sur
            la base (<strong>{fmtRef(base.max)}</strong>) — typique après une restauration de sauvegarde.
            Cliquez <strong>↺ Réaligner</strong> puis <strong>Valider</strong>.
          </div>
        )}
      </div>

      {/* ── Verdict du contrôle automatique ────────────────────────────────── */}
      {!valide && saisie.trim() !== '' && (
        <Alert type="error" showIcon message="Numéro invalide"
          description="Saisissez un nombre entier entre 0 et 999999."
          style={{ marginBottom: 10, fontSize: 11 }} />
      )}

      {bloque && (
        <Alert type="error" showIcon icon={<WarningOutlined />}
          message={`Refusé : ${collisions.length} référence(s) existante(s) seraient ré-attribuées`}
          description={
            <span style={{ fontSize: 11 }}>
              Les prochains enregistrements repartiraient à {fmtRef(val + 1)} alors que ces
              références sont déjà prises :{' '}
              <strong style={{ fontFamily: 'Courier New, monospace' }}>
                {collisions.slice(0, 6).map(fmtRef).join(', ')}
                {collisions.length > 6 ? `… (+${collisions.length - 6})` : ''}
              </strong>
              . Minimum autorisé : <strong>{fmtRef(base.max)}</strong>.
            </span>
          }
          style={{ marginBottom: 10, fontSize: 11 }} />
      )}

      {valide && !bloque && ecart === 0 && (
        <Alert type="success" showIcon icon={<CheckCircleOutlined />}
          message="Aligné sur la base — aucun risque de doublon"
          description={`Le prochain enregistrement portera le n° ${fmtRef(prochain)}.`}
          style={{ marginBottom: 10, fontSize: 11 }} />
      )}

      {valide && !bloque && ecart > 0 && (
        <Alert type="warning" showIcon
          message={`Saut de ${ecart} numéro(s) dans la numérotation`}
          description={`Autorisé, mais les n° ${fmtRef(base.max + 1)} à ${fmtRef(val)} resteront inutilisés. Prochain enregistrement : ${fmtRef(prochain)}.`}
          style={{ marginBottom: 10, fontSize: 11 }} />
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 14 }}>
        <Button type="primary" onClick={valider} disabled={!valide || bloque}
          style={{ background: !valide || bloque ? undefined : C.green, borderColor: !valide || bloque ? undefined : C.green, minWidth: 120 }}>
          ✓ Valider
        </Button>
        <Button onClick={fermer} danger style={{ minWidth: 110 }}>✗ Fermer</Button>
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
