import { useState, useMemo } from 'react'
import { DatePicker, Select, Button, Table, Tag, Progress, Typography, Radio } from 'antd'
import { BarChartOutlined, PrinterOutlined, ReloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { mockVehicules } from '@mock/vehicules'
import { mockDestinations } from '@mock/destinations'

const { RangePicker } = DatePicker
const { Title, Text } = Typography

type GroupBy = 'destination' | 'type' | 'agent' | 'parc'

interface StatRow {
  key: string
  label: string
  count: number
  montant: number
  pct: number
}

const DEST_COLORS: Record<string, string> = {
  AFO: 'green', CK: 'blue', KA: 'cyan', KE: 'orange',
  KP: 'purple', KW: 'geekblue', NO: 'volcano', TO: 'gold',
  'S\\C': 'lime', POL: 'red'
}
const destLabel = (code: string): string => mockDestinations.find(d => d.code === code)?.nom ?? code

export default function AnalysePage(): JSX.Element {
  const [period, setPeriod]   = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)
  const [groupBy, setGroupBy] = useState<GroupBy>('destination')
  const [generated, setGenerated] = useState(false)
  const [loading, setLoading]     = useState(false)

  const filtered = useMemo(() => {
    if (!generated) return []
    return mockVehicules.filter(v => {
      if (!period) return true
      const d = dayjs(v.date)
      return !d.isBefore(period[0], 'day') && !d.isAfter(period[1], 'day')
    })
  }, [generated, period])

  const rows = useMemo<StatRow[]>(() => {
    if (!generated) return []
    const map = new Map<string, { count: number; montant: number }>()
    for (const v of filtered) {
      const key = groupBy === 'destination' ? v.destination
                : groupBy === 'type'        ? v.typeVehicule
                : groupBy === 'agent'       ? v.agent
                :                             v.parc
      const cur = map.get(key) ?? { count: 0, montant: 0 }
      map.set(key, { count: cur.count + 1, montant: cur.montant + v.montant })
    }
    const maxCount = Math.max(...Array.from(map.values()).map(x => x.count), 1)
    return Array.from(map.entries())
      .map(([key, val]) => ({
        key,
        label: groupBy === 'destination' ? destLabel(key) : key,
        count: val.count,
        montant: val.montant,
        pct: Math.round((val.count / maxCount) * 100),
      }))
      .sort((a, b) => b.count - a.count)
  }, [filtered, groupBy, generated])

  const total  = filtered.length
  const totalM = filtered.reduce((s, v) => s + v.montant, 0)

  const handleGenerer = async (): Promise<void> => {
    setLoading(true)
    await new Promise(r => setTimeout(r, 500))
    setLoading(false)
    setGenerated(true)
  }

  const handleReset = (): void => {
    setGenerated(false)
    setPeriod(null)
    setGroupBy('destination')
  }

  const columns: ColumnsType<StatRow> = [
    {
      title: '#', width: 44, align: 'center',
      render: (_, __, i) => <span style={{ color: '#9CA3AF', fontSize: 11 }}>{i + 1}</span>
    },
    {
      title: groupBy === 'destination' ? 'Frontière' : groupBy === 'type' ? 'Type véhicule' : groupBy === 'agent' ? 'Agent' : 'Parc',
      dataIndex: 'key',
      render: (v, r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {groupBy === 'destination'
            ? <Tag color={DEST_COLORS[v] ?? 'default'} style={{ fontWeight: 700 }}>{v}</Tag>
            : null}
          <span style={{ fontWeight: 500 }}>{r.label}</span>
        </div>
      )
    },
    {
      title: 'Véhicules', dataIndex: 'count', width: 100, align: 'center',
      render: v => <span style={{ fontWeight: 700, color: '#1B3A6B', fontSize: 15 }}>{v}</span>
    },
    {
      title: 'Montant FCFA', dataIndex: 'montant', width: 140, align: 'right',
      render: v => <span style={{ fontWeight: 600, color: '#16A34A' }}>{v.toLocaleString('fr-FR')} F</span>
    },
    {
      title: 'Part', key: 'pct', width: 120,
      render: (_, r) => (
        <Progress percent={r.pct} size="small" strokeColor="#1B3A6B" trailColor="#E5E7EB"
          format={p => <span style={{ fontSize: 10 }}>{p}%</span>} />
      )
    },
  ]

  return (
    <div style={{ animation: 'formEnter 0.3s ease' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <BarChartOutlined style={{ fontSize: 20, color: '#1B3A6B' }} />
        <Title level={5} style={{ margin: 0, color: '#1B3A6B' }}>Édition des Rapports d'Analyse</Title>
      </div>

      {/* Paramètres */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', marginBottom: 16,
        padding: '10px 14px', background: '#F8FAFF', border: '1px solid #E5E7EB', borderRadius: 8 }}>

        <div>
          <div style={{ fontSize: 9, color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Période
          </div>
          <RangePicker format="DD/MM/YYYY" value={period}
            onChange={v => { setPeriod(v as [dayjs.Dayjs, dayjs.Dayjs] | null); setGenerated(false) }}
            style={{ height: 28 }} size="small" />
        </div>

        <div>
          <div style={{ fontSize: 9, color: '#6B7280', letterSpacing: 0.8, textTransform: 'uppercase', fontWeight: 700, marginBottom: 4 }}>
            Regroupement
          </div>
          <Select size="small" value={groupBy} onChange={v => { setGroupBy(v); setGenerated(false) }}
            style={{ width: 180 }}
            options={[
              { value: 'destination', label: 'Par frontière' },
              { value: 'type',        label: 'Par type de véhicule' },
              { value: 'agent',       label: 'Par agent' },
              { value: 'parc',        label: 'Par parc d\'importation' },
            ]} />
        </div>

        <Button type="primary" icon={<BarChartOutlined />} loading={loading}
          onClick={handleGenerer}
          style={{ background: '#1B3A6B', borderColor: '#1B3A6B', height: 28, fontSize: 12 }}>
          Générer
        </Button>

        {generated && (
          <Button icon={<ReloadOutlined />} size="small" onClick={handleReset}
            style={{ height: 28, fontSize: 12 }}>
            Réinitialiser
          </Button>
        )}

        {generated && (
          <Button icon={<PrinterOutlined />} size="small"
            style={{ height: 28, fontSize: 12, marginLeft: 'auto', borderColor: '#1B3A6B', color: '#1B3A6B' }}>
            Imprimer
          </Button>
        )}
      </div>

      {/* Résultats */}
      {!generated ? (
        <div style={{ textAlign: 'center', paddingTop: 50, color: '#9CA3AF' }}>
          <BarChartOutlined style={{ fontSize: 48, marginBottom: 12, display: 'block', opacity: 0.3 }} />
          <Text type="secondary">Sélectionnez une période et cliquez sur Générer</Text>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 20, marginBottom: 12, justifyContent: 'flex-end' }}>
            <Stat label="Total véhicules" value={total} />
            <Stat label="Total FCFA" value={`${totalM.toLocaleString('fr-FR')} F`} money />
            <Stat label="Groupes" value={rows.length} />
          </div>
          <Table
            columns={columns} dataSource={rows} rowKey="key"
            size="small" pagination={false}
            rowClassName={(_, i) => i % 2 === 0 ? '' : 'table-row-alt'}
            style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #E5E7EB' }}
            summary={() => (
              <Table.Summary.Row style={{ background: '#EFF6FF' }}>
                <Table.Summary.Cell index={0} />
                <Table.Summary.Cell index={1}>
                  <span style={{ fontWeight: 700, color: '#1B3A6B' }}>TOTAL</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="center">
                  <span style={{ fontWeight: 800, color: '#1B3A6B', fontSize: 15 }}>{total}</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <span style={{ fontWeight: 700, color: '#16A34A' }}>{totalM.toLocaleString('fr-FR')} F</span>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            )}
          />
        </>
      )}
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
