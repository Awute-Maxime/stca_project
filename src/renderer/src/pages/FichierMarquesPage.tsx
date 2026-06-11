import { useState, useMemo } from 'react'
import { Table, Input, Select, Button, Modal, Form, Tag } from 'antd'
import {
  SearchOutlined, PlusOutlined, EditOutlined,
  DeleteOutlined, CarOutlined, CheckOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockVehicules } from '@mock/vehicules'

const C = {
  blue:   '#1B3A6B',
  accent: '#2563EB',
  green:  '#16A34A',
  muted:  '#6B7280',
  border: '#E2E8F0',
  bg:     '#F8FAFF',
  danger: '#DC2626',
}

const TYPES_VEHICULE = ['Voiture', 'Camion', 'Moto', 'Bus', 'Pick-up', 'Minibus']
const TYPE_COLORS: Record<string, string> = {
  'Voiture': '#2563EB', 'Camion': '#D97706', 'Moto': '#DC2626',
  'Bus': '#16A34A', 'Pick-up': '#7C3AED', 'Minibus': '#0891B2',
}

interface MarqueEntry {
  id: number
  marque: string
  modele: string
  type: string
}

const INITIAL_MARQUES: MarqueEntry[] = [
  { id: 1,  marque: 'TOYOTA',     modele: 'COROLLA',          type: 'Voiture' },
  { id: 2,  marque: 'TOYOTA',     modele: 'HILUX',            type: 'Pick-up' },
  { id: 3,  marque: 'TOYOTA',     modele: 'HIACE',            type: 'Minibus' },
  { id: 4,  marque: 'TOYOTA',     modele: 'LAND CRUISER',     type: 'Voiture' },
  { id: 5,  marque: 'MERCEDES',   modele: 'ACTROS',           type: 'Camion' },
  { id: 6,  marque: 'MERCEDES',   modele: 'SPRINTER',         type: 'Minibus' },
  { id: 7,  marque: 'FORD',       modele: 'RANGER',           type: 'Pick-up' },
  { id: 8,  marque: 'FORD',       modele: 'TRANSIT',          type: 'Camion' },
  { id: 9,  marque: 'RENAULT',    modele: 'MASTER',           type: 'Camion' },
  { id: 10, marque: 'RENAULT',    modele: 'TRAFIC',           type: 'Minibus' },
  { id: 11, marque: 'PEUGEOT',    modele: '306',              type: 'Voiture' },
  { id: 12, marque: 'PEUGEOT',    modele: 'BOXER',            type: 'Camion' },
  { id: 13, marque: 'VOLKSWAGEN', modele: 'GOLF',             type: 'Voiture' },
  { id: 14, marque: 'VOLKSWAGEN', modele: 'TRANSPORTER',      type: 'Camion' },
  { id: 15, marque: 'NISSAN',     modele: 'NAVARA',           type: 'Pick-up' },
  { id: 16, marque: 'NISSAN',     modele: 'PATROL',           type: 'Voiture' },
  { id: 17, marque: 'HONDA',      modele: 'CB 125',           type: 'Moto' },
  { id: 18, marque: 'YAMAHA',     modele: 'FZ 150',           type: 'Moto' },
  { id: 19, marque: 'DAF',        modele: 'XF 105',           type: 'Camion' },
  { id: 20, marque: 'MAN',        modele: 'TGX 18.480',       type: 'Camion' },
  { id: 21, marque: 'MITSUBISHI', modele: 'L200',             type: 'Pick-up' },
  { id: 22, marque: 'ISUZU',      modele: 'D-MAX',            type: 'Pick-up' },
  { id: 23, marque: 'ACERBI',     modele: '125 PS',           type: 'Moto' },
  { id: 24, marque: 'FIAT',       modele: 'DUCATO',           type: 'Camion' },
  { id: 25, marque: 'OPEL',       modele: 'ASTRA',            type: 'Voiture' },
  { id: 26, marque: 'HONDA',      modele: 'ACCORD',           type: 'Voiture' },
]

export default function FichierMarquesPage(): JSX.Element {
  const [marques,      setMarques]      = useState<MarqueEntry[]>(INITIAL_MARQUES)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState<string | undefined>()
  const [modalOpen,    setModalOpen]    = useState(false)
  const [editRow,      setEditRow]      = useState<MarqueEntry | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null)
  const [form]                          = Form.useForm()

  const countByModel = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of mockVehicules) m.set(v.marqueModele, (m.get(v.marqueModele) ?? 0) + 1)
    return m
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return marques.filter(m => {
      if (q && !m.marque.toLowerCase().includes(q) && !m.modele.toLowerCase().includes(q)) return false
      if (typeFilter && m.type !== typeFilter) return false
      return true
    })
  }, [marques, search, typeFilter])

  const openAdd = (): void => { setEditRow(null); form.resetFields(); setModalOpen(true) }
  const openEdit = (row: MarqueEntry): void => {
    setEditRow(row); form.setFieldsValue(row); setModalOpen(true)
  }

  const handleSave = (): void => {
    form.validateFields().then(vals => {
      if (editRow) {
        setMarques(prev => prev.map(m => m.id === editRow.id ? { ...m, ...vals } : m))
      } else {
        setMarques(prev => [...prev, { id: Date.now(), ...vals }])
      }
      setModalOpen(false)
    })
  }

  const handleDelete = (): void => {
    if (deleteTarget == null) return
    setMarques(prev => prev.filter(m => m.id !== deleteTarget))
    setDeleteTarget(null)
  }

  const columns: ColumnsType<MarqueEntry> = [
    {
      title: 'Marque', dataIndex: 'marque', width: 140, sorter: (a, b) => a.marque.localeCompare(b.marque),
      render: v => <span style={{ fontWeight: 700, color: C.blue, fontFamily: 'monospace', letterSpacing: 0.5 }}>{v}</span>,
    },
    {
      title: 'Modèle', dataIndex: 'modele', sorter: (a, b) => a.modele.localeCompare(b.modele),
      render: v => <span style={{ fontSize: 12, color: '#374151' }}>{v}</span>,
    },
    {
      title: 'Type', dataIndex: 'type', width: 110,
      render: v => (
        <Tag style={{ fontWeight: 600, fontSize: 10, border: 'none', background: `${TYPE_COLORS[v] ?? C.muted}18`, color: TYPE_COLORS[v] ?? C.muted }}>
          {v}
        </Tag>
      ),
    },
    {
      title: 'Enregistrements', width: 110, align: 'center' as const,
      render: (_, row) => {
        const key = `${row.marque} ${row.modele}`
        const count = countByModel.get(key) ?? 0
        return <span style={{ fontSize: 11, color: count > 0 ? C.green : C.muted, fontWeight: count > 0 ? 600 : 400 }}>{count}</span>
      },
    },
    {
      title: '', width: 80, align: 'center' as const,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(row)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => setDeleteTarget(row.id)} />
        </div>
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
          <CarOutlined style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>
            LISTE DES MARQUES / MODÈLES DE VÉHICULES
          </span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>{filtered.length} / {marques.length} entrées</span>
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <Input placeholder="Rechercher marque ou modèle…" prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          value={search} onChange={e => setSearch(e.target.value)} allowClear style={{ flex: 1 }} size="small" />
        <Select placeholder="Type véhicule" value={typeFilter} onChange={setTypeFilter} allowClear
          options={TYPES_VEHICULE.map(t => ({ value: t, label: t }))} style={{ width: 150 }} size="small" />
        <Button icon={<PlusOutlined />} type="primary" onClick={openAdd} size="small"
          style={{ background: C.blue, borderColor: C.blue }}>
          Ajouter
        </Button>
      </div>

      {/* Table */}
      <Table
        columns={columns} dataSource={filtered} rowKey="id" size="small"
        pagination={{ pageSize: 12, showSizeChanger: false, showTotal: t => `${t} modèle(s)` }}
        style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
        rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'}
      />

      {/* Modal ajout/édition */}
      <Modal
        title={<><CarOutlined style={{ color: C.blue, marginRight: 6 }} />{editRow ? 'Modifier la marque / modèle' : 'Ajouter une marque / modèle'}</>}
        open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)}
        okText={editRow ? 'Modifier' : 'Ajouter'}
        okButtonProps={{ style: { background: C.blue, borderColor: C.blue } }}
        width={380}
      >
        <Form form={form} layout="vertical" size="small" style={{ marginTop: 8 }}>
          <Form.Item name="marque" label="Marque" rules={[{ required: true, message: 'Marque requise' }]}>
            <Input placeholder="Ex : TOYOTA" style={{ textTransform: 'uppercase' }}
              onChange={e => form.setFieldValue('marque', e.target.value.toUpperCase())} />
          </Form.Item>
          <Form.Item name="modele" label="Modèle" rules={[{ required: true, message: 'Modèle requis' }]}>
            <Input placeholder="Ex : HILUX" />
          </Form.Item>
          <Form.Item name="type" label="Type de véhicule" rules={[{ required: true }]}>
            <Select options={TYPES_VEHICULE.map(t => ({ value: t, label: t }))} placeholder="Sélectionner…" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Modal suppression */}
      <Modal
        title="Confirmer la suppression" open={deleteTarget !== null}
        onOk={handleDelete} onCancel={() => setDeleteTarget(null)}
        okText="Supprimer" okButtonProps={{ danger: true }}
        cancelText="Annuler" width={360}
      >
        <p style={{ fontSize: 12 }}>
          Supprimer cette entrée ? Cette action ne peut pas être annulée.
        </p>
      </Modal>
    </div>
  )
}
