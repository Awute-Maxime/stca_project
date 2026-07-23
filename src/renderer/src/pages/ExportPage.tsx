import { Tabs, Empty } from 'antd'
import {
  DatabaseOutlined, CloudUploadOutlined, SaveOutlined, RollbackOutlined, FileExcelOutlined,
} from '@ant-design/icons'
import ImportAssistant from './ImportAssistant'

// ─────────────────────────────────────────────────────────────────────────────
// Outil de données — Sauvegarde / Restauration / Import ancienne base / Export.
// Remplace l'ancienne « Exportation des enregistrements » (stub). Pour l'instant
// seul l'onglet Import est actif ; Sauvegarde / Restauration / Export rapport
// arriveront en Phase 3 (une fois l'app basculée sur la base de données).
// ─────────────────────────────────────────────────────────────────────────────

const C = { blue: '#1B3A6B', muted: '#6B7280' }

function AVenir({ quoi }: { quoi: string }): JSX.Element {
  return (
    <div style={{ padding: '30px 0' }}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <span style={{ color: C.muted, fontSize: 12 }}>
            {quoi} — disponible après la bascule de l'application sur la base de données (Phase 3).
          </span>
        }
      />
    </div>
  )
}

export default function ExportPage(): JSX.Element {
  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Sub-header beige (modèle validé) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 12, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <DatabaseOutlined style={{ color: C.blue, fontSize: 15 }} />
        <span style={{ color: C.blue, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
          Données — Sauvegarde, Restauration &amp; Import
        </span>
      </div>

      <Tabs
        defaultActiveKey="import"
        size="small"
        items={[
          {
            key: 'import',
            label: <span><CloudUploadOutlined /> Import ancienne base</span>,
            children: <ImportAssistant />,
          },
          {
            key: 'sauvegarde',
            label: <span><SaveOutlined /> Sauvegarde</span>,
            children: <AVenir quoi="La sauvegarde complète de la base" />,
          },
          {
            key: 'restauration',
            label: <span><RollbackOutlined /> Restauration</span>,
            children: <AVenir quoi="La restauration d'une sauvegarde" />,
          },
          {
            key: 'export',
            label: <span><FileExcelOutlined /> Export rapport</span>,
            children: <AVenir quoi="L'export Excel / CSV / PDF des enregistrements" />,
          },
        ]}
      />
    </div>
  )
}
