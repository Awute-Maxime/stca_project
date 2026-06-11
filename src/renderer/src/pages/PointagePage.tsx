import { useState, useMemo } from 'react'
import { Table, Input, Select, DatePicker, Button, Tag, TimePicker, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
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

const DEST_COLORS: Record<string, string> = {
  AFO: 'green', CK: 'blue', KA: 'cyan', KE: 'orange',
  KP: 'purple', KW: 'geekblue', NO: 'volcano', TO: 'gold',
  'S/C': 'lime', POL: 'red',
}
const destLabel = (code: string): string => mockDestinations.find(d => d.code === code)?.nom ?? code

interface PointageState {
  pointe: boolean
  heureSortie: string | null
}

// Prépointer les 8 premiers
const INITIAL_POINTAGE: Record<number, PointageState> = Object.fromEntries(
  mockVehicules.slice(0, 8).map(v => [v.id, { pointe: true, heureSortie: '08:30' }])
)

export default function PointagePage(): JSX.Element {
  const [search,     setSearch]     = useState('')
  const [destFilter, setDestFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null)
  const [pointage,   setPointage]   = useState<Record<number, PointageState>>(INITIAL_POINTAGE)

  const point = (id: number): PointageState => pointage[id] ?? { pointe: false, heureSortie: null }

  const filtered = useMemo(() => {
    return mockVehicules.filter(v => {
      if (search && !v.immat.toLowerCase().includes(search.toLowerCase()) &&
          !v.nomAcheteur.toLowerCase().includes(search.toLowerCase())) return false
      if (destFilter && v.destination !== destFilter) return false
      if (dateFilter && !dayjs(v.date).isSame(dateFilter, 'day')) return false
      return true
    })
  }, [search, destFilter, dateFilter])

  const nbPointe   = filtered.filter(v => point(v.id).pointe).length
  const nbRestant  = filtered.length - nbPointe
  const tauxSortie = filtered.length > 0 ? Math.round((nbPointe / filtered.length) * 100) : 0

  const handlePointer = (id: number): void => {
    setPointage(prev => ({
      ...prev,
      [id]: { pointe: !prev[id]?.pointe, heureSortie: !prev[id]?.pointe ? dayjs().format('HH:mm') : null },
    }))
  }

  const handleHeure = (id: number, heure: string | null): void => {
    setPointage(prev => ({ ...prev, [id]: { ...prev[id] ?? { pointe: false }, heureSortie: heure } }))
  }

  const reset = (): void => { setSearch(''); setDestFilter(null); setDateFilter(null) }

  const columns: ColumnsType<MockVehicule> = [
    {
      title: 'N° IMMAT', dataIndex: 'immat', width: 100,
      render: v => <span style={{ fontFamily: 'monospace', fontWeight: 700, color: C.blue, fontSize: 12 }}>{v}</span>,
    },
    { title: 'Type', dataIndex: 'typeVehicule', width: 80, render: v => <span style={{ fontSize: 11, color: C.muted }}>{v}</span> },
    { title: 'Marque / Modèle', dataIndex: 'marqueModele', render: v => <span style={{ fontSize: 12 }}>{v}</span> },
    {
      title: 'Destination', dataIndex: 'destination', width: 140,
      render: v => <Tag color={DEST_COLORS[v]} style={{ fontWeight: 600, fontSize: 10 }}>{v} — {destLabel(v)}</Tag>,
    },
    {
      title: 'Acheteur', dataIndex: 'nomAcheteur', width: 140,
      render: v => <span style={{ fontSize: 11 }}>{v}</span>,
    },
    {
      title: 'Agent', dataIndex: 'agent', width: 80,
      render: v => <span style={{ fontSize: 11, color: C.muted }}>{v}</span>,
    },
    {
      title: 'Heure sortie', width: 110, align: 'center' as const,
      render: (_, row) => {
        const p = point(row.id)
        return p.pointe ? (
          <TimePicker
            size="small"
            format="HH:mm"
            value={p.heureSortie ? dayjs(p.heureSortie, 'HH:mm') : null}
            onChange={v => handleHeure(row.id, v ? v.format('HH:mm') : null)}
            allowClear={false}
            style={{ width: 90 }}
          />
        ) : (
          <span style={{ color: '#D1D5DB', fontSize: 11 }}>—</span>
        )
      },
    },
    {
      title: 'Statut / Action', width: 110, align: 'center' as const,
      render: (_, row) => {
        const p = point(row.id)
        return p.pointe ? (
          <Tooltip title="Dépointer">
            <Button size="small"
              style={{ background: '#F0FDF4', borderColor: '#86EFAC', color: C.green, fontWeight: 600, fontSize: 10 }}
              icon={<CheckCircleOutlined />}
              onClick={() => handlePointer(row.id)}>
              Pointé
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Valider la sortie">
            <Button size="small" type="primary"
              style={{ background: C.accent, borderColor: C.accent, fontSize: 10 }}
              icon={<ClockCircleOutlined />}
              onClick={() => handlePointer(row.id)}>
              Pointer
            </Button>
          </Tooltip>
        )
      },
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Header gradient */}
      <div style={{
        background: `linear-gradient(135deg, ${C.blue} 0%, ${C.accent} 100%)`,
        padding: '8px 12px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircleOutlined style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15 }} />
          <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, letterSpacing: 0.8 }}>
            POINTAGE / DÉPOINTAGE — SORTIE DES VÉHICULES
          </span>
        </div>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10 }}>
          {dayjs().format('DD/MM/YYYY')}
        </span>
      </div>

      {/* Stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        {[
          { label: 'Véhicules pointés', value: nbPointe, color: C.green, bg: '#F0FDF4', border: '#BBF7D0' },
          { label: 'En attente de sortie', value: nbRestant, color: C.gold, bg: '#FFFBEB', border: '#FDE68A' },
          { label: 'Total en liste', value: filtered.length, color: C.blue, bg: C.bg, border: '#DDEAFF' },
          { label: 'Taux de sortie', value: `${tauxSortie}%`, color: C.accent, bg: C.bg, border: '#DDEAFF' },
        ].map(s => (
          <div key={s.label} style={{
            flex: 1, padding: '8px 12px', background: s.bg,
            border: `1px solid ${s.border}`, borderRadius: 6, textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 9, color: C.muted, marginTop: 3, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
        <Input placeholder="Recherche immat / acheteur…" prefix={<SearchOutlined style={{ color: '#ccc' }} />}
          value={search} onChange={e => setSearch(e.target.value)} allowClear size="small" style={{ width: 200 }} />
        <Select placeholder="Destination" value={destFilter} onChange={setDestFilter} allowClear size="small"
          options={mockDestinations.map(d => ({ value: d.code, label: `${d.code} — ${d.nom}` }))} style={{ width: 175 }} />
        <DatePicker placeholder="Date" value={dateFilter} onChange={setDateFilter} format="DD/MM/YYYY"
          size="small" style={{ width: 130 }} />
        <Button icon={<ReloadOutlined />} size="small" onClick={reset}>Réinitialiser</Button>
        <span style={{ fontSize: 11, color: C.muted, marginLeft: 'auto' }}>{filtered.length} véhicule(s)</span>
      </div>

      <Table
        columns={columns} dataSource={filtered} rowKey="id" size="small"
        pagination={{ pageSize: 12, showSizeChanger: false }}
        style={{ border: `1px solid ${C.border}`, borderRadius: 6 }}
        rowClassName={(row) => point(row.id).pointe ? '' : 'table-row-alt'}
      />
    </div>
  )
}
