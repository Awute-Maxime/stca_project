import { useState, useMemo } from 'react'
import { Table, Input, DatePicker, Button, Modal, Alert, notification } from 'antd'
import {
  SearchOutlined, InboxOutlined, RollbackOutlined,
  DeleteOutlined, WarningOutlined, HistoryOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useVehicules } from '@mock/vehiculesStore'
import {
  useArchives, vehiculesArchivables, archiverJusquAu,
  rappelerArchives, purgerArchives, type VehiculeArchive,
} from '@mock/archivesStore'

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVAGE (menu Outils+Config.) — fidèle à l'esprit du vrai STCA II
// (capture du 19/07/2026 : bandeau date + « Lancer l'archivage » 🔑, table
// verte « Enregistrements archivés », Quitter) :
// - allège la base active en déplaçant les enregistrements jusqu'à une date
//   limite (choisie par l'Administrateur — l'accès est déjà protégé par le
//   mot de passe de forçage via MdpAdminGate),
// - les archives restent consultables ici et RAPPELABLES à tout moment
//   (retour dans la base active), avec purge définitive en option.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  blue:   '#1B3A6B',
  accent: '#2563EB',
  green:  '#16A34A',
  muted:  '#6B7280',
  border: '#E2E8F0',
  danger: '#DC2626',
}

const fmtMontant = (n: number): string => `${n.toLocaleString('fr-FR')} F`

export default function ArchivagePage(): JSX.Element {
  const actifs = useVehicules()   // base active — synchro toutes fenêtres
  const archives = useArchives()  // archives — synchro toutes fenêtres

  const [dateLimite, setDateLimite] = useState<dayjs.Dayjs>(() => dayjs().subtract(3, 'year'))
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [purgeOpen, setPurgeOpen] = useState(false)

  const sessionLogin = localStorage.getItem('tcit_session_login') ?? 'Administrateur'

  // Aperçu en direct de ce que l'archivage déplacerait (réagit à la date ET à la base)
  const archivables = useMemo(
    () => vehiculesArchivables(dateLimite.format('YYYY-MM-DD')),
    [dateLimite, actifs] // eslint-disable-line react-hooks/exhaustive-deps
  )

  const filtrees = useMemo(() => {
    if (!search) return archives
    const q = search.toLowerCase()
    return archives.filter(a =>
      a.ref.toLowerCase().includes(q) ||
      a.nomAcheteur.toLowerCase().includes(q) ||
      a.immat.toLowerCase().includes(q) ||
      a.chassis.toLowerCase().includes(q) ||
      a.marqueModele.toLowerCase().includes(q)
    )
  }, [archives, search])

  const montantArchive = useMemo(() => archives.reduce((s, a) => s + a.montant, 0), [archives])

  const lancerArchivage = (): void => {
    const nb = archiverJusquAu(dateLimite.format('YYYY-MM-DD'), sessionLogin)
    setConfirmOpen(false)
    notification.success({
      message: `📦 Archivage terminé — ${nb} enregistrement(s)`,
      description: `La base active est allégée. Les archives restent consultables et rappelables à tout moment.`,
      placement: 'bottomRight',
    })
  }

  const rappeler = (refs: string[]): void => {
    const nb = rappelerArchives(refs)
    setSelected(prev => prev.filter(r => !refs.includes(r)))
    notification.success({
      message: `↩ ${nb} enregistrement(s) rappelé(s)`,
      description: 'Ils sont de retour dans la base active (Liste des véhicules).',
      placement: 'bottomRight',
    })
  }

  const purger = (): void => {
    const nb = purgerArchives(selected)
    setSelected([])
    setPurgeOpen(false)
    notification.warning({
      message: `🗑 ${nb} archive(s) purgée(s) définitivement`,
      placement: 'bottomRight',
    })
  }

  // ── Colonnes — mêmes informations que la table du vrai STCA ───────────────
  const columns: ColumnsType<VehiculeArchive> = [
    {
      title: 'Ref', dataIndex: 'ref', width: 70,
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{v}</span>,
    },
    {
      title: 'Nom et prénom', dataIndex: 'nomAcheteur', ellipsis: true,
      render: v => <span style={{ fontSize: 11.5, fontWeight: 600, color: '#1E293B' }}>{v}</span>,
    },
    {
      title: 'Code', dataIndex: 'destination', width: 58, align: 'center' as const,
      render: v => <span style={{ fontSize: 11, fontWeight: 700, color: C.blue }}>{v}</span>,
    },
    { title: 'Marque et modèle', dataIndex: 'marqueModele', ellipsis: true, render: v => <span style={{ fontSize: 11.5 }}>{v}</span> },
    {
      title: 'N° Chassis', dataIndex: 'chassis', width: 150, ellipsis: true,
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 10.5 }}>{v}</span>,
    },
    {
      title: 'Immatriculation', dataIndex: 'immat', width: 105,
      render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.blue, fontSize: 11.5 }}>{v}</span>,
    },
    {
      title: 'N° de Tri', dataIndex: 'numTri', width: 70, align: 'center' as const,
      render: v => <span style={{ fontFamily: 'monospace', fontSize: 11 }}>{v}</span>,
    },
    {
      title: 'Montant', dataIndex: 'montant', width: 85, align: 'right' as const,
      render: v => <span style={{ fontWeight: 600, color: C.green, fontSize: 11 }}>{fmtMontant(v)}</span>,
    },
    {
      title: 'Enregistré le', dataIndex: 'date', width: 95,
      render: v => <span style={{ fontSize: 11, color: C.muted }}>{dayjs(v).format('DD/MM/YYYY')}</span>,
    },
    {
      title: 'Saisie par', dataIndex: 'agent', width: 85,
      render: v => <span style={{ fontSize: 11, color: C.muted }}>{v}</span>,
    },
    {
      title: "Archivé le", dataIndex: 'dateArchivage', width: 95,
      render: (v, row) => (
        <span style={{ fontSize: 11, color: C.blue, fontWeight: 600 }} title={`Archivé par ${row.archivePar}`}>
          {dayjs(v).format('DD/MM/YYYY')}
        </span>
      ),
    },
    {
      title: '', width: 92, align: 'center' as const,
      render: (_, row) => (
        <Button size="small" icon={<RollbackOutlined />} onClick={() => rappeler([row.ref])}
          style={{ fontSize: 10, color: C.accent, borderColor: C.accent }}>
          Rappeler
        </Button>
      ),
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Lignes vertes alternées — clin d'œil à la table du vrai STCA */}
      <style>{`
        .archives-table .table-row-verte td { background: #F3F9EC !important; }
        .archives-table .ant-table-thead > tr > th {
          background: #EEF3FB !important; color: #1B3A6B !important;
          font-size: 10.5px !important; font-weight: 700 !important;
        }
      `}</style>

      {/* Sub-header beige (modèle validé) + Quitter comme le vrai STCA */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <InboxOutlined style={{ color: C.blue, fontSize: 15 }} />
        <span style={{ color: C.blue, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
          Archivage des enregistrements
        </span>
        <span style={{ color: '#64748B', fontSize: 10.5 }}>
          🚗 <strong>{actifs.length}</strong> actifs · 📦 <strong>{archives.length}</strong> archivés
          {archives.length > 0 && <> · 💰 <strong>{fmtMontant(montantArchive)}</strong></>}
        </span>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.danger, fontSize: 11.5, fontWeight: 700,
        }}>
          Quitter <span style={{ fontSize: 14 }}>⊗</span>
        </button>
      </div>

      {/* ── Lancer un archivage (bandeau du haut du vrai STCA, modernisé) ──── */}
      <div style={{
        border: '1px solid #BFDBFE', background: '#F8FBFF', borderRadius: 8,
        padding: '12px 16px', marginBottom: 10,
        display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
      }}>
        <HistoryOutlined style={{ color: C.accent, fontSize: 17 }} />
        <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>
          Archiver les enregistrements jusqu&apos;au :
        </span>
        <DatePicker
          value={dateLimite} onChange={d => { if (d) setDateLimite(d) }}
          format="DD/MM/YYYY" allowClear={false} size="small" style={{ width: 130 }}
        />
        <span style={{
          fontSize: 11.5, fontWeight: 700,
          color: archivables.length > 0 ? C.accent : C.muted,
        }}>
          → {archivables.length} enregistrement(s) concerné(s) sur {actifs.length}
        </span>
        <Button
          type="primary" disabled={archivables.length === 0}
          onClick={() => setConfirmOpen(true)}
          style={{ marginLeft: 'auto', fontWeight: 700, fontSize: 12 }}
        >
          🔑 Lancer l&apos;archivage
        </Button>
      </div>

      <Alert
        type="info" showIcon
        message="L'archivage allège la base active. Les enregistrements archivés restent consultables ci-dessous et peuvent être rappelés dans la base active à tout moment."
        style={{ marginBottom: 10, fontSize: 11 }}
      />

      {/* ── Enregistrements archivés ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <span style={{ fontSize: 12.5, fontWeight: 700, color: C.blue, fontStyle: 'italic' }}>
          Enregistrements archivés
        </span>
        <Input placeholder="Recherche ref / nom / immat / châssis / marque…"
          prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small"
          style={{ width: 280, marginLeft: 8 }} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {selected.length > 0 && (
            <>
              <Button size="small" icon={<RollbackOutlined />} onClick={() => rappeler(selected)}
                style={{ color: C.accent, borderColor: C.accent, fontWeight: 600 }}>
                Rappeler la sélection ({selected.length})
              </Button>
              <Button danger size="small" icon={<DeleteOutlined />} onClick={() => setPurgeOpen(true)}>
                Purger ({selected.length})
              </Button>
            </>
          )}
        </div>
      </div>

      <Table
        className="archives-table"
        columns={columns} dataSource={filtrees} rowKey="ref" size="small"
        pagination={{ pageSize: 10, showSizeChanger: false, showTotal: t => `${t} archive(s)` }}
        rowSelection={{
          selectedRowKeys: selected,
          onChange: keys => setSelected(keys as string[]),
        }}
        locale={{ emptyText: 'Aucun enregistrement archivé pour le moment.' }}
        style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
        rowClassName={(_, i) => i % 2 === 1 ? 'table-row-verte' : ''}
      />

      {/* ── Confirmation d'archivage ─────────────────────────────────────────── */}
      <Modal
        title={<>📦 Lancer l&apos;archivage</>}
        open={confirmOpen} onOk={lancerArchivage} onCancel={() => setConfirmOpen(false)}
        okText={`Archiver ${archivables.length} enregistrement(s)`} cancelText="Annuler" width={440}
      >
        <p style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.6 }}>
          Les <strong>{archivables.length} enregistrement(s)</strong> enregistrés jusqu&apos;au{' '}
          <strong>{dateLimite.format('DD/MM/YYYY')}</strong> seront déplacés vers les archives.
          <br />La base active passera de <strong>{actifs.length}</strong> à{' '}
          <strong>{actifs.length - archivables.length}</strong> enregistrements.
        </p>
        <Alert type="info" showIcon style={{ fontSize: 11 }}
          message="Les archives restent consultables et rappelables à tout moment — rien n'est supprimé." />
      </Modal>

      {/* ── Confirmation de purge définitive ─────────────────────────────────── */}
      <Modal
        title={<><WarningOutlined style={{ color: C.danger, marginRight: 6 }} />Purger les archives</>}
        open={purgeOpen} onOk={purger} onCancel={() => setPurgeOpen(false)}
        okText="Purger définitivement" okButtonProps={{ danger: true }} cancelText="Annuler" width={400}
      >
        <p style={{ fontSize: 12, marginBottom: 8 }}>
          Vous allez supprimer définitivement <strong>{selected.length} archive(s)</strong>.
          Cette action est irréversible.
        </p>
        <Alert type="warning" message="Les données purgées ne pourront plus être rappelées." showIcon style={{ fontSize: 11 }} />
      </Modal>
    </div>
  )
}
