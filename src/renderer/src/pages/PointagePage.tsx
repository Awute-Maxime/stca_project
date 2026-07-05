import { useState, useMemo } from 'react'
import { Table, Input, Select, DatePicker, Button, Tag, TimePicker, Tooltip } from 'antd'
import { SearchOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { type MockVehicule } from '@mock/vehicules'
import { useVehicules, updateVehicule } from '@mock/vehiculesStore'
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

// Palette exacte du prototype (identique aux autres fenêtres)
const DEST_COLORS: Record<string, string> = {
  AFO: '#DC2626', CK: '#DC2626', KA: '#DC2626', KE: '#DC2626', TO: '#DC2626',
  KP: '#16A34A', KW: '#16A34A', NO: '#16A34A',
  'S/C': '#FFD700', POL: '#94A3B8',
}
function destTxt(bg: string): string {
  return (bg === '#FFD700' || bg === '#94A3B8') ? '#1E293B' : '#fff'
}
const destLabel = (code: string): string => mockDestinations.find(d => d.code === code)?.nom ?? code

export default function PointagePage(): JSX.Element {
  const vehicules = useVehicules() // store partagé — pointage = recyclerPlaque (synchro toutes fenêtres)
  const [search,     setSearch]     = useState('')
  const [destFilter, setDestFilter] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<dayjs.Dayjs | null>(null)
  // Heures de sortie affichées (l'état "sorti" lui-même vit dans le store)
  const [heures, setHeures] = useState<Record<number, string | null>>({})

  const point = (row: MockVehicule): { pointe: boolean; heureSortie: string | null } => ({
    pointe: row.recyclerPlaque,
    heureSortie: row.recyclerPlaque ? (heures[row.id] ?? '08:30') : null,
  })

  const filtered = useMemo(() => {
    return vehicules.filter(v => {
      if (search && !v.immat.toLowerCase().includes(search.toLowerCase()) &&
          !v.nomAcheteur.toLowerCase().includes(search.toLowerCase())) return false
      if (destFilter && v.destination !== destFilter) return false
      if (dateFilter && !dayjs(v.date).isSame(dateFilter, 'day')) return false
      return true
    })
  }, [vehicules, search, destFilter, dateFilter])

  const nbPointe   = filtered.filter(v => point(v).pointe).length
  const nbRestant  = filtered.length - nbPointe
  const tauxSortie = filtered.length > 0 ? Math.round((nbPointe / filtered.length) * 100) : 0

  const handlePointer = (row: MockVehicule): void => {
    const sortant = !row.recyclerPlaque
    updateVehicule(row.ref, { recyclerPlaque: sortant }) // écriture réelle — synchro toutes fenêtres
    setHeures(prev => ({ ...prev, [row.id]: sortant ? dayjs().format('HH:mm') : null }))
  }

  const handleHeure = (id: number, heure: string | null): void => {
    setHeures(prev => ({ ...prev, [id]: heure }))
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
      render: v => {
        const bg = DEST_COLORS[v] ?? '#6B7280'
        return <Tag style={{ fontWeight: 600, fontSize: 10, background: bg, color: destTxt(bg), borderColor: bg }}>{v} — {destLabel(v)}</Tag>
      },
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
        const p = point(row)
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
        const p = point(row)
        return p.pointe ? (
          <Tooltip title="Dépointer">
            <Button size="small"
              style={{ background: '#F0FDF4', borderColor: '#86EFAC', color: C.green, fontWeight: 600, fontSize: 10 }}
              icon={<CheckCircleOutlined />}
              onClick={() => handlePointer(row)}>
              Pointé
            </Button>
          </Tooltip>
        ) : (
          <Tooltip title="Valider la sortie">
            <Button size="small" type="primary"
              style={{ background: C.accent, borderColor: C.accent, fontSize: 10 }}
              icon={<ClockCircleOutlined />}
              onClick={() => handlePointer(row)}>
              Pointer
            </Button>
          </Tooltip>
        )
      },
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Header — sub-header beige (modèle Enregistrement, pas de 2e bandeau bleu) */}
      <div style={{
        background: '#F5F3EE', borderBottom: '2px solid #E2D9C8',
        padding: '9px 14px', marginBottom: 10, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircleOutlined style={{ color: '#1B3A6B', fontSize: 15 }} />
          <span style={{ color: '#1B3A6B', fontSize: 10.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase' }}>
            Pointage / Dépointage — Sortie des Véhicules
          </span>
        </div>
        <span style={{ color: '#64748B', fontSize: 10 }}>
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
        rowClassName={(row) => point(row).pointe ? '' : 'table-row-alt'}
      />
    </div>
  )
}
