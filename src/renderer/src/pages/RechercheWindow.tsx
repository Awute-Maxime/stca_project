import { useState } from 'react'
import { Input, Button, Table, Tag, Empty, Typography, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { mockVehicules, type MockVehicule } from '@mock/vehicules'
import { mockDestinations } from '@mock/destinations'

const { Text } = Typography

const DEST_COLORS: Record<string, string> = {
  AFO: 'green', CK: 'blue', KA: 'cyan', KE: 'orange',
  KP: 'purple', KW: 'geekblue', NO: 'volcano', TO: 'gold',
  'S/C': 'lime', POL: 'red'
}

const destLabel = (code: string): string =>
  mockDestinations.find(d => d.code === code)?.nom ?? code

const columns: ColumnsType<MockVehicule> = [
  {
    title: 'Immatriculation', dataIndex: 'immat', width: 120,
    render: v => <strong style={{ color: '#1B3A6B', letterSpacing: 1, fontFamily: 'monospace' }}>{v}</strong>
  },
  {
    title: 'N° Chassis (VIN)', dataIndex: 'chassis',
    render: v => <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#555' }}>{v}</span>
  },
  { title: 'Type', dataIndex: 'typeVehicule', width: 90 },
  { title: 'Marque / Modèle', dataIndex: 'marqueModele' },
  {
    title: 'Destination', dataIndex: 'destination', width: 150,
    render: v => (
      <Tag color={DEST_COLORS[v]} style={{ fontWeight: 600 }}>
        {v} — {destLabel(v)}
      </Tag>
    )
  },
  {
    title: 'Date', dataIndex: 'date', width: 120,
    render: v => <span style={{ fontSize: 11, color: '#888' }}>{dayjs(v).format('DD/MM/YY HH:mm')}</span>
  },
  {
    title: 'Acheteur', dataIndex: 'nomAcheteur', width: 140,
    render: v => <span style={{ fontSize: 12 }}>{v}</span>
  },
]

interface Props {
  mode: 'immat' | 'chassis'
}

export default function RechercheWindow({ mode }: Props): JSX.Element {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<MockVehicule[] | null>(null)

  const placeholder = mode === 'immat'
    ? 'Ex : C7388, T5001, A3910…'
    : 'Ex : ZFA29000000302873'

  const label = mode === 'immat' ? 'N° Immatriculation' : 'N° Chassis (VIN)'

  const handleSearch = (): void => {
    if (!query.trim()) { setResults([]); return }
    const q = query.trim().toLowerCase()
    const found = mockVehicules.filter(v =>
      mode === 'immat'
        ? v.immat.toLowerCase().includes(q)
        : v.chassis.toLowerCase().includes(q)
    )
    setResults(found)
  }

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 4, letterSpacing: 0.5 }}>
            {label.toUpperCase()}
          </div>
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            onPressEnter={handleSearch}
            placeholder={placeholder}
            style={{ fontFamily: 'monospace', letterSpacing: 1 }}
            size="large"
            autoFocus
          />
        </div>
        <Button
          type="primary"
          icon={<SearchOutlined />}
          size="large"
          onClick={handleSearch}
          style={{ background: '#1B3A6B', borderColor: '#1B3A6B', minWidth: 110 }}
        >
          Rechercher
        </Button>
      </div>

      {results === null && (
        <div style={{ textAlign: 'center', color: '#aaa', paddingTop: 40 }}>
          <SearchOutlined style={{ fontSize: 40, marginBottom: 12, display: 'block' }} />
          <Text type="secondary">
            Saisissez {mode === 'immat' ? 'un numéro d\'immatriculation' : 'un numéro de chassis'} et lancez la recherche
          </Text>
        </div>
      )}

      {results !== null && results.length === 0 && (
        <Empty description={`Aucun véhicule trouvé pour « ${query} »`} />
      )}

      {results !== null && results.length > 0 && (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {results.length} résultat(s) trouvé(s)
          </Text>
          <Table
            columns={columns}
            dataSource={results}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 900 }}
          />
        </Space>
      )}
    </div>
  )
}
