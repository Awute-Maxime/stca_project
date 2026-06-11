import { useState, useMemo } from 'react'
import { Table, Input, Select, DatePicker, Button, Tag, Space, Modal, Alert } from 'antd'
import {
  SearchOutlined, ReloadOutlined, InboxOutlined,
  RollbackOutlined, DeleteOutlined, WarningOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { mockVehicules, type MockVehicule } from '@mock/vehicules'
import { mockDestinations } from '@mock/destinations'

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
const { RangePicker } = DatePicker

const DEST_COLORS: Record<string, string> = {
  AFO: 'green', CK: 'blue', KA: 'cyan', KE: 'orange',
  KP: 'purple', KW: 'geekblue', NO: 'volcano', TO: 'gold',
  'S/C': 'lime', POL: 'red',
}
const destLabel = (code: string): string => mockDestinations.find(d => d.code === code)?.nom ?? code

// Les 20 plus anciens records sont "archivés"
const ARCHIVED_IDS = new Set(mockVehicules.slice(32).map(v => v.id))

export default function ArchivagePage(): JSX.Element {
  const [search,     setSearch]     = useState('')
  const [destFilter, setDestFilter] = useState<string | null>(null)
  const [dateRange,  setDateRange]  = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [selected,   setSelected]   = useState<number[]>([])
  const [purgeOpen,  setPurgeOpen]  = useState(false)
  const [restored,   setRestored]   = useState<number[]>([])

  const archived = useMemo(() => mockVehicules.filter(v => ARCHIVED_IDS.has(v.id)), [])

  const filtered = useMemo(() => {
    return archived.filter(v => {
      if (restored.includes(v.id)) return false
      if (search && !v.immat.toLowerCase().includes(search.toLowerCase()) &&
          !v.marqueModele.toLowerCase().includes(search.toLowerCase())) return false
      if (destFilter && v.destination !== destFilter) return false
      if (dateRange) {
        const d = dayjs(v.date)
        if (d.isBefore(dateRange[0], 'day') || d.isAfter(dateRange[1], 'day')) return false
      }
      return true
    })
  }, [archived, search, destFilter, dateRange, restored])

  const handleRestore = (id: number): void => {
    setRestored(prev => [...prev, id])
    setSelected(prev => prev.filter(s => s !== id))
  }

  const handlePurge = (): void => {
    // mock: nothing to actually delete
    setPurgeOpen(false)
    setSelected([])
  }

  const columns: ColumnsType<MockVehicule> = [
    {
      title: 'N° IMMAT', dataIndex: 'immat', width: 100,
      render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.blue, fontSize: 12 }}>{v}</span>,
    },
    {
      title: 'Type', dataIndex: 'typeVehicule', width: 90,
      render: v => <span style={{ fontSize: 11, color: C.muted }}>{v}</span>,
    },
    { title: 'Marque / Modèle', dataIndex: 'marqueModele', render: v => <span style={{ fontSize: 12 }}>{v}</span> },
    {
      title: 'Destination', dataIndex: 'destination', width: 130,
      render: v => <Tag color={DEST_COLORS[v]} style={{ fontWeight: 600, fontSize: 10 }}>{v} — {destLabel(v)}</Tag>,
    },
    {
      title: 'Date archivage', dataIndex: 'date', width: 120,
      render: v => <span style={{ fontSize: 11, color: C.muted }}>{dayjs(v).format('DD/MM/YY')}</span>,
    },
    {
      title: 'Montant', dataIndex: 'montant', width: 100, align: 'right' as const,
      render: v => <span style={{ fontWeight: 600, color: C.green, fontSize: 11 }}>{v.toLocaleString('fr-FR')} F</span>,
    },
    {
      title: '', width: 90, align: 'center' as const,
      render: (_, row) => (
        <Button size="small" icon={<RollbackOutlined />} onClick={() => handleRestore(row.id)}
          style={{ fontSize: 10, color: C.accent, borderColor: C.accent }}>
          Restaurer
        </Button>
      ),
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.accent} 100%)`,
        padding: '8px 12px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <InboxOutlined style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>
            ENREGISTREMENTS ARCHIVÉS
          </span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>
            {filtered.length} enregistrements archivés
          </span>
          {restored.length > 0 && (
            <span style={{ color: '#4ADE80', fontSize: 10, fontWeight: 600 }}>
              ✓ {restored.length} restauré(s)
            </span>
          )}
        </div>
      </div>

      <Alert
        type="info" showIcon
        message="Les enregistrements archivés sont conservés 3 ans puis purgés automatiquement. Vous pouvez les restaurer à tout moment."
        style={{ marginBottom: 10, fontSize: 11 }}
      />

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Input placeholder="Recherche immat / marque…" prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ width: 200 }} />
        <Select placeholder="Destination" value={destFilter} onChange={setDestFilter} allowClear size="small"
          options={mockDestinations.map(d => ({ value: d.code, label: `${d.code} — ${d.nom}` }))} style={{ width: 180 }} />
        <RangePicker format="DD/MM/YYYY" size="small"
          value={dateRange} onChange={v => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)} />
        <Space style={{ marginLeft: 'auto' }}>
          <Button icon={<ReloadOutlined />} size="small"
            onClick={() => { setSearch(''); setDestFilter(null); setDateRange(null) }}>
            Réinitialiser
          </Button>
          {selected.length > 0 && (
            <Button danger icon={<DeleteOutlined />} size="small" onClick={() => setPurgeOpen(true)}>
              Purger ({selected.length})
            </Button>
          )}
        </Space>
      </div>

      <Table
        columns={columns} dataSource={filtered} rowKey="id" size="small"
        pagination={{ pageSize: 12, showSizeChanger: false, showTotal: t => `${t} entrée(s)` }}
        rowSelection={{
          selectedRowKeys: selected,
          onChange: keys => setSelected(keys as number[]),
        }}
        style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
        rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'}
      />

      <Modal title={<><WarningOutlined style={{ color: C.danger, marginRight: 6 }} />Purger les enregistrements</>}
        open={purgeOpen} onOk={handlePurge} onCancel={() => setPurgeOpen(false)}
        okText="Purger définitivement" okButtonProps={{ danger: true }} width={400}>
        <p style={{ fontSize: 12, marginBottom: 8 }}>
          Vous allez supprimer définitivement <strong>{selected.length} enregistrement(s)</strong> archivé(s).
          Cette action est irréversible.
        </p>
        <Alert type="warning" message="Les données supprimées ne pourront pas être récupérées." showIcon style={{ fontSize: 11 }} />
      </Modal>
    </div>
  )
}
