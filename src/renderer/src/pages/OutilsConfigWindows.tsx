import { useState, useMemo } from 'react'
import { Table, Switch, Input, Button, Select, Tag, InputNumber, Tooltip } from 'antd'
import {
  CarOutlined, EnvironmentOutlined, PrinterOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined, CheckOutlined,
} from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockVehicules } from '@mock/vehicules'
import { mockDestinations, type MockDestination } from '@mock/destinations'

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
      padding: '9px 14px', marginBottom: 12, borderRadius: 6,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{ color: '#1B3A6B', fontSize: 16 }}>{icon}</span>
      <div>
        <div style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>{title}</div>
        {subtitle && <div style={{ color: '#64748B', fontSize: 9, marginTop: 1 }}>{subtitle}</div>}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TYPES VÉHICULE
// ─────────────────────────────────────────────────────────────────────────────
const TYPE_COLORS: Record<string, string> = {
  'Voiture': '#2563EB', 'Camion': '#D97706', 'Moto': '#DC2626',
  'Bus': '#16A34A', 'Pick-up': '#7C3AED', 'Minibus': '#0891B2',
}

const INITIAL_TYPES = [
  { id: 1, nom: 'Voiture',  actif: true },
  { id: 2, nom: 'Camion',   actif: true },
  { id: 3, nom: 'Moto',     actif: true },
  { id: 4, nom: 'Bus',      actif: true },
  { id: 5, nom: 'Pick-up',  actif: true },
  { id: 6, nom: 'Minibus',  actif: true },
]

export function TypesVehiculeWindow(): JSX.Element {
  const [types,    setTypes]    = useState(INITIAL_TYPES)
  const [newType,  setNewType]  = useState('')
  const [editId,   setEditId]   = useState<number | null>(null)
  const [editName, setEditName] = useState('')
  const [saved,    setSaved]    = useState(false)

  const countByType = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of mockVehicules) m.set(v.typeVehicule, (m.get(v.typeVehicule) ?? 0) + 1)
    return m
  }, [])

  const handleAdd = (): void => {
    const name = newType.trim()
    if (!name || types.some(t => t.nom.toLowerCase() === name.toLowerCase())) return
    setTypes(prev => [...prev, { id: Date.now(), nom: name, actif: true }])
    setNewType('')
  }

  const handleToggle = (id: number, actif: boolean): void => {
    setTypes(prev => prev.map(t => t.id === id ? { ...t, actif } : t))
  }

  const handleDelete = (id: number): void => {
    setTypes(prev => prev.filter(t => t.id !== id))
  }

  const handleSaveEdit = (): void => {
    if (!editName.trim()) return
    setTypes(prev => prev.map(t => t.id === editId ? { ...t, nom: editName.trim() } : t))
    setEditId(null)
  }

  const handleSave = (): void => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  const columns: ColumnsType<typeof INITIAL_TYPES[0]> = [
    {
      title: '', dataIndex: 'nom', width: 14,
      render: nom => (
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_COLORS[nom] ?? C.muted }} />
      ),
    },
    {
      title: 'Type de véhicule', dataIndex: 'nom', width: 180,
      render: (nom, row) => editId === row.id
        ? <Input value={editName} onChange={e => setEditName(e.target.value)}
            onPressEnter={handleSaveEdit} size="small" autoFocus style={{ width: 150 }} />
        : <span style={{ fontWeight: 600, color: C.blue }}>{nom}</span>,
    },
    {
      title: 'Enregistrements', dataIndex: 'nom', width: 120, align: 'center' as const,
      render: nom => (
        <span style={{ fontSize: 12, color: countByType.get(nom) ? C.green : C.muted, fontWeight: 600 }}>
          {countByType.get(nom) ?? 0}
        </span>
      ),
    },
    {
      title: 'Actif', dataIndex: 'actif', width: 70, align: 'center' as const,
      render: (actif, row) => (
        <Switch size="small" checked={actif} onChange={v => handleToggle(row.id, v)} />
      ),
    },
    {
      title: '', width: 70, align: 'center' as const,
      render: (_, row) => (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          {editId === row.id
            ? <Tooltip title="Valider"><Button size="small" type="primary" icon={<CheckOutlined />} onClick={handleSaveEdit} /></Tooltip>
            : <Tooltip title="Modifier"><Button size="small" icon={<EditOutlined />} onClick={() => { setEditId(row.id); setEditName(row.nom) }} /></Tooltip>
          }
          <Tooltip title="Supprimer">
            <Button size="small" danger icon={<DeleteOutlined />}
              onClick={() => handleDelete(row.id)}
              disabled={(countByType.get(row.nom) ?? 0) > 0} />
          </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader icon={<CarOutlined />} title="TYPES DE VÉHICULE" subtitle="Gérer les catégories de véhicules utilisées à l'enregistrement" />
      <Table columns={columns} dataSource={types} rowKey="id" size="small" pagination={false}
        style={{ marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 6 }} />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
        <Input value={newType} onChange={e => setNewType(e.target.value)} onPressEnter={handleAdd}
          placeholder="Nouveau type…" style={{ flex: 1 }} size="small" />
        <Button icon={<PlusOutlined />} onClick={handleAdd} disabled={!newType.trim()} size="small">Ajouter</Button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={saved ? <CheckOutlined /> : <SaveOutlined />} onClick={handleSave}
          style={{ background: saved ? C.green : C.blue, borderColor: saved ? C.green : C.blue }}>
          {saved ? 'Sauvegardé' : 'Enregistrer'}
        </Button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PARAMÈTRES DESTINATIONS
// ─────────────────────────────────────────────────────────────────────────────
export function ParamDestinationsWindow(): JSX.Element {
  const [dests,  setDests]  = useState<MockDestination[]>(mockDestinations)
  const [editId, setEditId] = useState<string | null>(null)
  const [saved,  setSaved]  = useState(false)

  const [editBuf, setEditBuf] = useState<Partial<MockDestination>>({})

  const startEdit = (d: MockDestination): void => {
    setEditId(d.code)
    setEditBuf({ nom: d.nom, lettre: d.lettre, numImmatActuel: d.numImmatActuel, tarif: d.tarif })
  }

  const saveEdit = (): void => {
    setDests(prev => prev.map(d => d.code === editId ? { ...d, ...editBuf } : d))
    setEditId(null)
    setEditBuf({})
  }

  const countByDest = useMemo(() => {
    const m = new Map<string, number>()
    for (const v of mockVehicules) m.set(v.destination, (m.get(v.destination) ?? 0) + 1)
    return m
  }, [])

  const columns: ColumnsType<MockDestination> = [
    {
      title: 'Code', dataIndex: 'code', width: 55,
      render: v => <Tag style={{ fontWeight: 700, background: C.blue, color: '#fff', border: 'none' }}>{v}</Tag>,
    },
    {
      title: 'Nom de la frontière', dataIndex: 'nom',
      render: (nom, row) => editId === row.code
        ? <Input size="small" value={editBuf.nom} onChange={e => setEditBuf(b => ({ ...b, nom: e.target.value }))} style={{ width: 150 }} autoFocus />
        : <span style={{ fontSize: 12, fontWeight: 500, color: C.blue }}>{nom}</span>,
    },
    {
      title: 'Lettre', dataIndex: 'lettre', width: 60, align: 'center' as const,
      render: (lettre, row) => editId === row.code
        ? <Input size="small" value={editBuf.lettre} maxLength={1}
            onChange={e => setEditBuf(b => ({ ...b, lettre: e.target.value.toUpperCase() }))}
            style={{ width: 50, textAlign: 'center', fontFamily: 'monospace' }} />
        : <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.accent }}>{lettre}</span>,
    },
    {
      title: 'N° actuel', dataIndex: 'numImmatActuel', width: 90, align: 'right' as const,
      render: (num, row) => editId === row.code
        ? <InputNumber size="small" value={editBuf.numImmatActuel} min={1} max={9999}
            onChange={v => setEditBuf(b => ({ ...b, numImmatActuel: v ?? 0 }))} style={{ width: 80 }} />
        : <span style={{ fontFamily: 'monospace', fontSize: 11, color: C.muted }}>{String(num).padStart(4, '0')}</span>,
    },
    {
      title: 'Tarif (FCFA)', dataIndex: 'tarif', width: 110, align: 'right' as const,
      render: (tarif, row) => editId === row.code
        ? <InputNumber size="small" value={editBuf.tarif} min={1000} step={500}
            onChange={v => setEditBuf(b => ({ ...b, tarif: v ?? 10000 }))} style={{ width: 90 }} />
        : <span style={{ fontWeight: 600, color: C.green, fontSize: 12 }}>{tarif.toLocaleString('fr-FR')} F</span>,
    },
    {
      title: 'Véhicules', width: 80, align: 'center' as const,
      render: (_, row) => <span style={{ fontSize: 11, color: C.muted }}>{countByDest.get(row.code) ?? 0}</span>,
    },
    {
      title: '', width: 80, align: 'center' as const,
      render: (_, row) => editId === row.code
        ? <Button size="small" type="primary" icon={<CheckOutlined />} onClick={saveEdit} />
        : <Button size="small" icon={<EditOutlined />} onClick={() => startEdit(row)} />,
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      <PageHeader icon={<EnvironmentOutlined />} title="PARAMÈTRES DESTINATIONS" subtitle="Configurer les 10 frontières actives" />
      <Table columns={columns} dataSource={dests} rowKey="code" size="small" pagination={false}
        style={{ marginBottom: 10, border: `1px solid ${C.border}`, borderRadius: 6 }}
        rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'} />
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button type="primary" icon={saved ? <CheckOutlined /> : <SaveOutlined />} onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000) }}
          style={{ background: saved ? C.green : C.blue, borderColor: saved ? C.green : C.blue }}>
          {saved ? 'Sauvegardé' : 'Enregistrer la configuration'}
        </Button>
      </div>
    </div>
  )
}
