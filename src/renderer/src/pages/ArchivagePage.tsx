import { useState, useMemo } from 'react'
import { Table, Input, DatePicker, Button, Modal, Alert, Tabs, notification } from 'antd'
import {
  SearchOutlined, InboxOutlined, RollbackOutlined,
  DeleteOutlined, WarningOutlined, HistoryOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useVehicules } from '@mock/vehiculesStore'
import type { MockVehicule } from '@mock/vehicules'
import {
  useArchives, vehiculesArchivables, archiverJusquAu,
  rappelerArchives, purgerArchives, type VehiculeArchive,
} from '@mock/archivesStore'

// ─────────────────────────────────────────────────────────────────────────────
// ARCHIVAGE (menu Outils+Config.) — principe métier (précisé le 19/07/2026) :
// l'archivage ne SORT PAS les enregistrements du système, il FLUIDIFIE les
// recherches : la base active (moins de 3 ans) est interrogée en premier, et
// les archives ne sont consultées QUE si rien n'est trouvé (recherche en deux
// temps, implémentée dans les fenêtres Recherche IMMAT / N° Châssis).
//
// La fenêtre affiche AUTOMATIQUEMENT les enregistrements ÉLIGIBLES (3 ans et
// plus) ; l'Administrateur (accès protégé par MdpAdminGate) archive TOUT ou
// choisit une période — forcément dans la plage éligible (DatePicker borné).
// Les archivés restent consultables ici et RAPPELABLES à tout moment.
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  blue:   '#1B3A6B',
  accent: '#2563EB',
  green:  '#16A34A',
  muted:  '#6B7280',
  border: '#E2E8F0',
  danger: '#DC2626',
}

export const DUREE_ARCHIVAGE_ANS = 3

const fmtMontant = (n: number): string => `${n.toLocaleString('fr-FR')} F`

/** « 3,2 ans » — ancienneté d'un enregistrement. */
const anciennete = (date: string): string =>
  `${(dayjs().diff(dayjs(date), 'month') / 12).toFixed(1).replace('.', ',')} ans`

export default function ArchivagePage(): JSX.Element {
  const actifs = useVehicules()   // base active — synchro toutes fenêtres
  const archives = useArchives()  // archives — synchro toutes fenêtres

  const seuil = useMemo(() => dayjs().subtract(DUREE_ARCHIVAGE_ANS, 'year'), [])
  const [dateLimite, setDateLimite] = useState<dayjs.Dayjs>(() => dayjs().subtract(DUREE_ARCHIVAGE_ANS, 'year'))
  const [confirmOpen, setConfirmOpen] = useState<'periode' | 'tout' | null>(null)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [purgeOpen, setPurgeOpen] = useState(false)

  const sessionLogin = localStorage.getItem('tcit_session_login') ?? 'Administrateur'

  // Éligibles (3 ans et plus) — affichés AUTOMATIQUEMENT, du plus ancien au plus récent
  const eligibles = useMemo(
    () => vehiculesArchivables(seuil.format('YYYY-MM-DD'))
      .sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf()),
    [seuil, actifs] // eslint-disable-line react-hooks/exhaustive-deps
  )

  // Sous-ensemble de la période choisie (bornée par le seuil d'éligibilité)
  const concernes = useMemo(
    () => eligibles.filter(v => dayjs(v.date).isBefore(dateLimite.endOf('day'))),
    [eligibles, dateLimite]
  )

  const archivesFiltrees = useMemo(() => {
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

  const lancerArchivage = (): void => {
    const limite = confirmOpen === 'tout' ? seuil : dateLimite
    const nb = archiverJusquAu(limite.format('YYYY-MM-DD'), sessionLogin)
    setConfirmOpen(null)
    notification.success({
      message: `📦 Archivage terminé — ${nb} enregistrement(s)`,
      description: 'Les recherches sont plus fluides ; les archivés restent disponibles (recherche en deux temps) et rappelables.',
      placement: 'bottomRight',
    })
  }

  const rappeler = (refs: string[]): void => {
    const nb = rappelerArchives(refs)
    setSelected(prev => prev.filter(r => !refs.includes(r)))
    notification.success({
      message: `↩ ${nb} enregistrement(s) rappelé(s)`,
      description: 'Ils sont de retour dans la base active.',
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

  // ── Colonnes communes (mêmes informations que la table du vrai STCA) ──────
  const colsBase: ColumnsType<MockVehicule> = [
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
  ]

  const colsEligibles: ColumnsType<MockVehicule> = [
    ...colsBase,
    {
      title: 'Ancienneté', dataIndex: 'date', key: 'anciennete', width: 85, align: 'center' as const,
      render: v => (
        <span style={{
          fontSize: 10.5, fontWeight: 700, color: '#92400E',
          background: '#FEF3C7', border: '1px solid #FDE68A', padding: '1px 7px', borderRadius: 8,
        }}>{anciennete(v)}</span>
      ),
    },
  ]

  const colsArchives: ColumnsType<VehiculeArchive> = [
    ...(colsBase as ColumnsType<VehiculeArchive>),
    {
      title: 'Archivé le', dataIndex: 'dateArchivage', width: 95,
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

  const nbConfirme = confirmOpen === 'tout' ? eligibles.length : concernes.length
  const dateConfirmee = confirmOpen === 'tout' ? seuil : dateLimite

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
        padding: '9px 14px', marginBottom: 8, borderRadius: 6,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <InboxOutlined style={{ color: C.blue, fontSize: 15 }} />
        <span style={{ color: C.blue, fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', flex: 1 }}>
          Archivage des enregistrements
        </span>
        <span style={{ color: '#64748B', fontSize: 10.5 }}>
          🚗 <strong>{actifs.length}</strong> actifs · ⏳ <strong>{eligibles.length}</strong> éligibles · 📦 <strong>{archives.length}</strong> archivés
        </span>
        <button onClick={() => window.dispatchEvent(new CustomEvent('mdi:close-self'))} style={{
          display: 'flex', alignItems: 'center', gap: 5, marginLeft: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          color: C.danger, fontSize: 11.5, fontWeight: 700,
        }}>
          Quitter <span style={{ fontSize: 14 }}>⊗</span>
        </button>
      </div>

      <Alert
        type="info" showIcon
        message={`L'archivage fluidifie le système : les recherches interrogent d'abord la base active, puis les archives seulement si rien n'est trouvé. Rien ne sort du système — les archivés restent disponibles et rappelables. Sont éligibles les enregistrements de ${DUREE_ARCHIVAGE_ANS} ans et plus.`}
        style={{ marginBottom: 8, fontSize: 11 }}
      />

      <Tabs
        size="small"
        items={[
          {
            key: 'eligibles',
            label: <span style={{ fontSize: 12, fontWeight: 700 }}>⏳ Éligibles à l&apos;archivage ({eligibles.length})</span>,
            children: (
              <>
                {/* Bandeau d'action : tout archiver, ou une période bornée */}
                <div style={{
                  border: '1px solid #BFDBFE', background: '#F8FBFF', borderRadius: 8,
                  padding: '10px 14px', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap',
                }}>
                  <HistoryOutlined style={{ color: C.accent, fontSize: 16 }} />
                  <span style={{ fontSize: 12, fontWeight: 700, color: C.blue }}>
                    Archiver les enregistrements jusqu&apos;au :
                  </span>
                  <DatePicker
                    value={dateLimite} onChange={d => { if (d) setDateLimite(d) }}
                    format="DD/MM/YYYY" allowClear={false} size="small" style={{ width: 125 }}
                    disabledDate={d => d.isAfter(seuil, 'day')}
                  />
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: concernes.length > 0 ? C.accent : C.muted }}>
                    → {concernes.length} sur {eligibles.length} éligible(s)
                  </span>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                    <Button size="small" disabled={concernes.length === 0 || concernes.length === eligibles.length}
                      onClick={() => setConfirmOpen('periode')}
                      style={{ fontWeight: 600, fontSize: 11.5 }}>
                      Archiver la période ({concernes.length})
                    </Button>
                    <Button type="primary" size="small" disabled={eligibles.length === 0}
                      onClick={() => setConfirmOpen('tout')}
                      style={{ fontWeight: 700, fontSize: 11.5 }}>
                      🔑 Tout archiver ({eligibles.length})
                    </Button>
                  </div>
                </div>

                <Table
                  className="archives-table"
                  columns={colsEligibles} dataSource={eligibles} rowKey="ref" size="small"
                  pagination={{ pageSize: 9, showSizeChanger: false, showTotal: t => `${t} éligible(s)` }}
                  locale={{ emptyText: `Aucun enregistrement de ${DUREE_ARCHIVAGE_ANS} ans ou plus — rien à archiver pour le moment.` }}
                  style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
                  rowClassName={(_, i) => i % 2 === 1 ? 'table-row-verte' : ''}
                />
              </>
            ),
          },
          {
            key: 'archives',
            label: <span style={{ fontSize: 12, fontWeight: 700 }}>📦 Enregistrements archivés ({archives.length})</span>,
            children: (
              <>
                <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                  <Input placeholder="Recherche ref / nom / immat / châssis / marque…"
                    prefix={<SearchOutlined style={{ color: '#ccc' }} />}
                    value={search} onChange={e => setSearch(e.target.value)} allowClear size="small"
                    style={{ width: 280 }} />
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
                  columns={colsArchives} dataSource={archivesFiltrees} rowKey="ref" size="small"
                  pagination={{ pageSize: 9, showSizeChanger: false, showTotal: t => `${t} archive(s)` }}
                  rowSelection={{
                    selectedRowKeys: selected,
                    onChange: keys => setSelected(keys as string[]),
                  }}
                  locale={{ emptyText: 'Aucun enregistrement archivé pour le moment.' }}
                  style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
                  rowClassName={(_, i) => i % 2 === 1 ? 'table-row-verte' : ''}
                />
              </>
            ),
          },
        ]}
      />

      {/* ── Confirmation d'archivage ─────────────────────────────────────────── */}
      <Modal
        title={<>📦 Lancer l&apos;archivage</>}
        open={confirmOpen !== null} onOk={lancerArchivage} onCancel={() => setConfirmOpen(null)}
        okText={`Archiver ${nbConfirme} enregistrement(s)`} cancelText="Annuler" width={450}
      >
        <p style={{ fontSize: 12, marginBottom: 8, lineHeight: 1.6 }}>
          {confirmOpen === 'tout'
            ? <>Tous les <strong>{nbConfirme} enregistrement(s) éligible(s)</strong> ({DUREE_ARCHIVAGE_ANS} ans et plus) seront archivés.</>
            : <>Les <strong>{nbConfirme} enregistrement(s)</strong> enregistrés jusqu&apos;au{' '}
              <strong>{dateConfirmee.format('DD/MM/YYYY')}</strong> seront archivés.</>}
          <br />La base active passera de <strong>{actifs.length}</strong> à{' '}
          <strong>{actifs.length - nbConfirme}</strong> enregistrements — les recherches seront plus fluides.
        </p>
        <Alert type="info" showIcon style={{ fontSize: 11 }}
          message="Rien ne sort du système : les archivés restent trouvables par la recherche (en deuxième temps) et rappelables ici." />
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
