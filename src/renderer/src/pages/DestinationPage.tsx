import { useMemo } from 'react'
import { Table, Tag, Progress, Typography } from 'antd'
import { EnvironmentOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import { mockDestinations, type MockDestination } from '@mock/destinations'
import { mockVehicules } from '@mock/vehicules'
import dayjs from 'dayjs'

const { Title } = Typography

const DEST_COLORS: Record<string, string> = {
  AFO: '#16A34A', CK:  '#2563EB', KA:  '#0891B2', KE:  '#D97706',
  KP:  '#7C3AED', KW:  '#1D4ED8', NO:  '#DC2626', TO:  '#B45309',
  'S\\C': '#65A30D', POL: '#9F1239'
}

interface DestRow extends MockDestination {
  nbVehicules: number
  montantTotal: number
  dernierImmat: string
  progression: number
}

export default function DestinationPage(): JSX.Element {
  const rows = useMemo<DestRow[]>(() => {
    const maxImmat = Math.max(...mockDestinations.map(d => d.numImmatActuel))
    return mockDestinations.map(dest => {
      const vehicules = mockVehicules.filter(v => v.destination === dest.code)
      const dernierVeh = vehicules.sort((a, b) => dayjs(b.date).unix() - dayjs(a.date).unix())[0]
      return {
        ...dest,
        nbVehicules:  vehicules.length,
        montantTotal: vehicules.reduce((s, v) => s + v.montant, 0),
        dernierImmat: dernierVeh?.immat ?? '—',
        progression:  Math.round((dest.numImmatActuel / maxImmat) * 100),
      }
    })
  }, [])

  const totalVehicules = rows.reduce((s, r) => s + r.nbVehicules, 0)
  const totalMontant   = rows.reduce((s, r) => s + r.montantTotal, 0)

  const columns: ColumnsType<DestRow> = [
    {
      title: 'Code', dataIndex: 'code', width: 70,
      render: v => (
        <Tag style={{ fontWeight: 700, letterSpacing: 1, background: DEST_COLORS[v] ?? '#1B3A6B', color: '#fff', border: 'none' }}>
          {v}
        </Tag>
      )
    },
    {
      title: 'Frontière / Poste', dataIndex: 'nom',
      render: (v, r) => (
        <div>
          <div style={{ fontWeight: 600, color: '#1E293B' }}>{v}</div>
          <div style={{ fontSize: 10, color: '#9CA3AF' }}>Lettre : <b>{r.lettre}</b></div>
        </div>
      )
    },
    {
      title: 'N° IMMAT actuel', dataIndex: 'numImmatActuel', width: 150, align: 'center',
      render: (v, r) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#1B3A6B', fontSize: 14, letterSpacing: 1 }}>
          {r.lettre}{String(v).padStart(4, '0')}
        </span>
      )
    },
    {
      title: 'Véhicules', dataIndex: 'nbVehicules', width: 100, align: 'center',
      sorter: (a, b) => a.nbVehicules - b.nbVehicules,
      render: v => (
        <span style={{ fontWeight: 700, color: v > 5 ? '#16A34A' : '#2563EB' }}>{v}</span>
      )
    },
    {
      title: 'Montant total', dataIndex: 'montantTotal', width: 140, align: 'right',
      sorter: (a, b) => a.montantTotal - b.montantTotal,
      render: v => <span style={{ fontWeight: 600, color: '#1B3A6B' }}>{v.toLocaleString('fr-FR')} F</span>
    },
    {
      title: 'Dernier immat.', dataIndex: 'dernierImmat', width: 120, align: 'center',
      render: v => <span style={{ fontFamily: 'monospace', color: '#2563EB', fontWeight: 600 }}>{v}</span>
    },
    {
      title: 'Trafic relatif', key: 'prog', width: 160,
      render: (_, r) => (
        <Progress
          percent={r.progression} size="small"
          strokeColor={DEST_COLORS[r.code] ?? '#1B3A6B'}
          trailColor="#E5E7EB"
          format={p => <span style={{ fontSize: 10 }}>{p}%</span>}
        />
      )
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <EnvironmentOutlined style={{ fontSize: 20, color: '#1B3A6B' }} />
          <Title level={5} style={{ margin: 0, color: '#1B3A6B' }}>Véhicules par Frontières</Title>
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          <Stat label="Frontières actives" value={rows.filter(r => r.nbVehicules > 0).length} />
          <Stat label="Total véhicules" value={totalVehicules} />
          <Stat label="Total FCFA" value={`${totalMontant.toLocaleString('fr-FR')} F`} money />
        </div>
      </div>

      {/* Tableau */}
      <Table
        columns={columns}
        dataSource={rows}
        rowKey="code"
        size="small"
        pagination={false}
        rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'}
        style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}
      />
    </div>
  )
}

function Stat({ label, value, money }: { label: string; value: string | number; money?: boolean }): JSX.Element {
  return (
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: 9, color: '#9CA3AF', letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700 }}>{label}</div>
      <div style={{ fontSize: money ? 12 : 18, fontWeight: 800, color: money ? '#16A34A' : '#1B3A6B', lineHeight: 1.2 }}>{value}</div>
    </div>
  )
}
