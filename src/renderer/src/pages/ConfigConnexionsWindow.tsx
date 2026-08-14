import { useEffect, useState } from 'react'
import { Tabs, Input, InputNumber, Switch, Button, notification, Tag } from 'antd'
import {
  ApiOutlined, DesktopOutlined, SafetyCertificateOutlined, WifiOutlined,
  CheckCircleOutlined, CloseCircleOutlined, LinkOutlined,
} from '@ant-design/icons'
import { electronApi, type AffichageConfig, type AffichageEtat } from '@api/electron'

// ── Palette maison ────────────────────────────────────────────────────────────
const C = {
  blue: 'var(--tc-heading)', accent: 'var(--accent)', green: '#16A34A', gold: '#F59E0B',
  muted: '#6B7280', border: 'var(--tc-line)', bg: 'var(--tc-section)', danger: '#DC2626',
}

function PageHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }): JSX.Element {
  return (
    <div style={{
      background: 'var(--tc-subheader-bg)', borderBottom: '2px solid var(--tc-subheader-bd)',
      padding: '10px 14px', marginBottom: 14, borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ color: C.blue, fontSize: 18 }}>{icon}</span>
      <div>
        <div style={{ color: C.blue, fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && <div style={{ color: 'var(--tc-muted)', fontSize: 10, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

const champLabel: React.CSSProperties = { fontSize: 12, fontWeight: 700, color: C.blue, marginBottom: 5, display: 'block' }

// ── Onglet « Poste d'affichage » ──────────────────────────────────────────────
function OngletPosteAffichage(): JSX.Element {
  const [actif, setActif]       = useState(false)
  const [nomPoste, setNomPoste] = useState('')
  const [ip, setIp]             = useState('192.168.0.25')
  const [port, setPort]         = useState<number>(8000)
  const [etat, setEtat]         = useState<AffichageEtat | null>(null)
  const [testEnCours, setTest]  = useState(false)

  useEffect(() => {
    void electronApi.affichageConfigGet().then(r => {
      if (r.ok && r.config) {
        setActif(r.config.actif); setNomPoste(r.config.nomPoste)
        setIp(r.config.ip); setPort(r.config.port)
      }
    })
    void electronApi.affichageEtat().then(r => { if (r.ok && r.etat) setEtat(r.etat) })
    const off = electronApi.onAffichageEtat(setEtat)
    return off
  }, [])

  const tester = async (): Promise<void> => {
    setTest(true)
    const r = await electronApi.affichageTester(ip, port)
    setTest(false)
    if (r.ok) notification.success({ message: '🔌 Test réussi', description: r.message, placement: 'bottomRight' })
    else notification.error({ message: '🔌 Test échoué', description: r.message, placement: 'bottomRight' })
  }

  const valider = async (): Promise<void> => {
    const cfg: AffichageConfig = { actif, nomPoste: nomPoste.trim(), ip: ip.trim(), port }
    const r = await electronApi.affichageConfigSet(cfg)
    if (r.ok) {
      notification.success({ message: '✅ Configuration enregistrée',
        description: actif ? `Envoi activé vers ${ip}:${port}.` : 'Envoi désactivé.', placement: 'bottomRight' })
      electronApi.mdiSelfClose()
    } else {
      notification.error({ message: 'Échec', description: r.error ?? 'Erreur inconnue', placement: 'bottomRight' })
    }
  }

  return (
    <div>
      <div style={{
        border: `1px solid ${C.border}`, borderRadius: 8, padding: 16,
        background: 'var(--tc-card)', marginBottom: 14,
      }}>
        {/* Activation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.blue }}>Envoi vers le poste d'affichage</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>
              Transmet chaque enregistrement à l'écran des opérateurs de plaques.
            </div>
          </div>
          <Switch checked={actif} onChange={setActif}
            checkedChildren="Activé" unCheckedChildren="Inactif"
            style={{ background: actif ? C.green : undefined }} />
        </div>

        {/* Nom du poste */}
        <div style={{ marginBottom: 14 }}>
          <label style={champLabel}>Nom de ce poste</label>
          <Input value={nomPoste} onChange={e => setNomPoste(e.target.value)}
            placeholder="ex. Guichet Principal" prefix={<DesktopOutlined style={{ color: C.muted }} />}
            style={{ maxWidth: 320 }} />
          <div style={{ fontSize: 10.5, color: C.muted, marginTop: 4 }}>
            Affiché dans la colonne « Nom du Poste » de l'écran (pré-rempli avec le nom de la machine).
          </div>
        </div>

        {/* IP + Port */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 4 }}>
          <div style={{ flex: 1 }}>
            <label style={champLabel}>Adresse IP du PC d'affichage</label>
            <Input value={ip} onChange={e => setIp(e.target.value)} placeholder="192.168.0.25"
              prefix={<WifiOutlined style={{ color: C.muted }} />} />
          </div>
          <div style={{ width: 130 }}>
            <label style={champLabel}>N° de Port</label>
            <InputNumber value={port} onChange={v => setPort(v ?? 8000)} min={1} max={65535}
              style={{ width: '100%' }} />
          </div>
        </div>
        <div style={{ fontSize: 10.5, color: C.muted, marginTop: 6 }}>
          💡 Test sur le même PC : IP <code>127.0.0.1</code>. Réseau réel : l'IP du poste d'affichage.
        </div>
      </div>

      {/* État de connexion en direct */}
      {etat && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, fontSize: 12 }}>
          <span style={{ color: C.muted }}>État :</span>
          {!etat.actif
            ? <Tag>Envoi inactif</Tag>
            : etat.connecte
              ? <Tag color="success" icon={<CheckCircleOutlined />}>Connecté à {etat.cible}</Tag>
              : <Tag color="error" icon={<CloseCircleOutlined />}>Hors ligne ({etat.cible})</Tag>}
          {etat.enAttente > 0 && <Tag color="warning">{etat.enAttente} en attente d'envoi</Tag>}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10 }}>
        <Button icon={<LinkOutlined />} loading={testEnCours} onClick={() => void tester()}>
          Tester la connexion
        </Button>
        <div style={{ flex: 1 }} />
        <Button type="primary" onClick={() => void valider()}
          style={{ background: C.accent, borderColor: C.accent }}>
          Valider
        </Button>
        <Button onClick={() => electronApi.mdiSelfClose()}>Fermer</Button>
      </div>
    </div>
  )
}

// ── Onglet « Mode assurance » (réservé) ───────────────────────────────────────
function OngletReserve(): JSX.Element {
  return (
    <div style={{
      border: `1px dashed ${C.border}`, borderRadius: 8, padding: '28px 20px',
      textAlign: 'center', color: C.muted, background: C.bg,
    }}>
      <SafetyCertificateOutlined style={{ fontSize: 26, color: '#CBD5E1' }} />
      <div style={{ fontSize: 13, fontWeight: 700, color: C.blue, marginTop: 8 }}>Mode assurance</div>
      <div style={{ fontSize: 11, marginTop: 4 }}>
        Cet onglet regroupera la configuration du mode assurance — à venir.
      </div>
    </div>
  )
}

// ── Fenêtre ───────────────────────────────────────────────────────────────────
export default function ConfigConnexionsWindow(): JSX.Element {
  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader
        icon={<ApiOutlined />}
        title="CONFIGURATION DES CONNEXIONS"
        subtitle="Liaisons de ce poste avec les applications connexes"
      />
      <Tabs
        defaultActiveKey="affichage"
        items={[
          { key: 'affichage', label: <span><DesktopOutlined /> Poste d'affichage</span>, children: <OngletPosteAffichage /> },
          { key: 'assurance', label: <span><SafetyCertificateOutlined /> Mode assurance</span>, children: <OngletReserve /> },
        ]}
      />
    </div>
  )
}
