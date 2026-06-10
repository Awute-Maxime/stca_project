import { useState, useMemo } from 'react'
import { Table, Input, Select, DatePicker, Button, Tag, Space, Card, Typography, Row, Col } from 'antd'
import { SearchOutlined, ReloadOutlined, FileExcelOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { mockVehicules, type MockVehicule } from '@mock/vehicules'
import { mockDestinations } from '@mock/destinations'

const { Title } = Typography
const { RangePicker } = DatePicker

type Vehicule = MockVehicule

const DESTINATIONS = mockDestinations.map(d => d.code)

const DEST_LABELS: Record<string, string> = Object.fromEntries(
  mockDestinations.map(d => [d.code, d.nom])
)

const DEST_COLORS: Record<string, string> = {
  AFO: 'green', CK: 'blue', KA: 'cyan', KE: 'orange',
  KP: 'purple', KW: 'geekblue', NO: 'volcano', TO: 'gold',
  'S/C': 'lime', POL: 'red'
}

const mockData = mockVehicules

export default function ListePage(): JSX.Element {
  const [search, setSearch] = useState('')
  const [destFilter, setDestFilter] = useState<string | null>(null)
  const [typeFilter, setTypeFilter] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null)

  const filtered = useMemo(() => {
    return mockData.filter(v => {
      if (search && !v.immat.toLowerCase().includes(search.toLowerCase()) &&
          !v.marqueModele.toLowerCase().includes(search.toLowerCase())) return false
      if (destFilter && v.destination !== destFilter) return false
      if (typeFilter && v.typeVehicule !== typeFilter) return false
      if (dateRange) {
        const d = dayjs(v.date)
        if (d.isBefore(dateRange[0], 'day') || d.isAfter(dateRange[1], 'day')) return false
      }
      return true
    })
  }, [search, destFilter, typeFilter, dateRange])

  const columns: ColumnsType<Vehicule> = [
    {
      title: 'N°', dataIndex: 'id', width: 60,
      render: (_, __, idx) => <span style={{ color: '#999', fontSize: 12 }}>{idx + 1}</span>
    },
    {
      title: 'Immatriculation', dataIndex: 'immat',
      render: v => <strong style={{ color: '#1B3A6B', letterSpacing: 1 }}>{v}</strong>
    },
    { title: 'Type', dataIndex: 'typeVehicule', width: 100 },
    { title: 'Marque / Modèle', dataIndex: 'marqueModele' },
    {
      title: 'Destination', dataIndex: 'destination', width: 130,
      render: v => (
        <Tag color={DEST_COLORS[v]} style={{ fontWeight: 600 }}>
          {v} — {DEST_LABELS[v]}
        </Tag>
      )
    },
    {
      title: 'Date', dataIndex: 'date', width: 140,
      render: v => <span style={{ fontSize: 12, color: '#666' }}>{dayjs(v).format('DD/MM/YY HH:mm')}</span>
    },
    {
      title: 'Montant', dataIndex: 'montant', width: 110, align: 'right',
      render: v => <strong style={{ color: '#1B3A6B' }}>{v.toLocaleString('fr-FR')} F</strong>
    },
    {
      title: 'Agent', dataIndex: 'agent', width: 90,
      render: v => <span style={{ fontSize: 12 }}>{v}</span>
    }
  ]

  const reset = (): void => {
    setSearch('')
    setDestFilter(null)
    setTypeFilter(null)
    setDateRange(null)
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0, color: '#1B3A6B' }}>
          Liste des véhicules enregistrés
        </Title>
        <Button icon={<FileExcelOutlined />} style={{ borderColor: '#1B3A6B', color: '#1B3A6B' }}>
          Exporter
        </Button>
      </div>

      {/* Filtres */}
      <Card style={{ marginBottom: 16, borderRadius: 8 }} bodyStyle={{ padding: '12px 16px' }}>
        <Row gutter={[12, 8]} align="middle">
          <Col flex="200px">
            <Input
              placeholder="Recherche immat / marque…"
              prefix={<SearchOutlined style={{ color: '#ccc' }} />}
              value={search}
              onChange={e => setSearch(e.target.value)}
              allowClear
            />
          </Col>
          <Col flex="160px">
            <Select
              placeholder="Destination"
              style={{ width: '100%' }}
              value={destFilter}
              onChange={setDestFilter}
              allowClear
              options={DESTINATIONS.map(d => ({ value: d, label: `${d} — ${DEST_LABELS[d]}` }))}
            />
          </Col>
          <Col flex="140px">
            <Select
              placeholder="Type véhicule"
              style={{ width: '100%' }}
              value={typeFilter}
              onChange={setTypeFilter}
              allowClear
              options={['Voiture', 'Camion', 'Moto', 'Bus', 'Pick-up'].map(t => ({ value: t, label: t }))}
            />
          </Col>
          <Col flex="240px">
            <RangePicker
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
              value={dateRange}
              onChange={v => setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs] | null)}
            />
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={reset} size="small">Réinitialiser</Button>
              <span style={{ color: '#999', fontSize: 12 }}>{filtered.length} résultat(s)</span>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card style={{ borderRadius: 8 }} bodyStyle={{ padding: 0 }}>
        <Table
          columns={columns}
          dataSource={filtered}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 15, showSizeChanger: false, showTotal: t => `${t} véhicule(s)` }}
          scroll={{ x: 900 }}
          rowClassName={(_, idx) => idx % 2 === 0 ? '' : 'table-row-alt'}
        />
      </Card>
    </motion.div>
  )
}
