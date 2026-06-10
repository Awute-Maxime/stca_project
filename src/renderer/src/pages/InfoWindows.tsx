import { Typography, Divider } from 'antd'
import {
  CopyrightOutlined, InfoCircleOutlined, GlobalOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography

const ROW_STYLE: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  padding: '6px 0', borderBottom: '1px solid #f0f0f0', fontSize: 12,
}

export function CopyrightWindow(): JSX.Element {
  return (
    <div style={{ textAlign: 'center', padding: '8px 0' }}>
      <CopyrightOutlined style={{ fontSize: 36, color: '#1B3A6B', marginBottom: 10 }} />
      <Title level={5} style={{ color: '#1B3A6B', marginBottom: 4 }}>TCIT — Togolaise de Contrôle et d'Immatriculation Transit</Title>
      <Text type="secondary" style={{ fontSize: 12 }}>Système de Traçabilité et de Contrôle des véhicules en Transit (STCA)</Text>
      <Divider style={{ margin: '12px 0' }} />
      <Text style={{ fontSize: 12 }}>© 2024 TCIT — Tous droits réservés</Text>
      <br />
      <Text type="secondary" style={{ fontSize: 11 }}>Développé pour la Direction Générale des Douanes du Togo</Text>
    </div>
  )
}

export function VersionWindow(): JSX.Element {
  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <InfoCircleOutlined style={{ fontSize: 28, color: '#1B3A6B' }} />
        <Title level={5} style={{ margin: 0, color: '#1B3A6B' }}>Informations de version</Title>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">Application</Text>
        <Text strong>STCA — Enregistrement des Véhicules</Text>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">Version</Text>
        <Text strong style={{ fontFamily: 'monospace' }}>3.0.0</Text>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">Build</Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>2024.06.10-electron</Text>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">Electron</Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>28.x</Text>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">React</Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>18.x</Text>
      </div>
      <div style={{ ...ROW_STYLE, borderBottom: 'none' }}>
        <Text type="secondary">Base de données</Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>PostgreSQL (Prisma)</Text>
      </div>
    </div>
  )
}

export function IdReseauWindow(): JSX.Element {
  const machineId = 'TCIT-POSTE-' + Math.random().toString(36).substring(2, 6).toUpperCase()

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <GlobalOutlined style={{ fontSize: 28, color: '#1B3A6B' }} />
        <Title level={5} style={{ margin: 0, color: '#1B3A6B' }}>Identification réseau du poste</Title>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">ID Poste</Text>
        <Text strong style={{ fontFamily: 'monospace' }}>{machineId}</Text>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">Adresse IP locale</Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>192.168.1.{10 + Math.floor(Math.random() * 50)}</Text>
      </div>
      <div style={ROW_STYLE}>
        <Text type="secondary">Serveur TCIT</Text>
        <Text style={{ fontFamily: 'monospace', fontSize: 11 }}>192.168.1.1:3000</Text>
      </div>
      <div style={{ ...ROW_STYLE, borderBottom: 'none' }}>
        <Text type="secondary">Statut connexion</Text>
        <Text style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>● Connecté (mock)</Text>
      </div>
    </div>
  )
}
