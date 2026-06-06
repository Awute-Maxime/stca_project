import { useState } from 'react'
import { Card, Row, Col, Statistic, Select, Progress, Typography, Table } from 'antd'
import { CarOutlined, DollarOutlined, EnvironmentOutlined, UserOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'

const { Title, Text } = Typography

const DESTINATIONS = [
  { code: 'CK', label: 'Cinkassé', count: 42, color: '#006A4E' },
  { code: 'AFO', label: 'Afolé', count: 35, color: '#008060' },
  { code: 'KP', label: 'Kpadapé', count: 28, color: '#009970' },
  { code: 'NO', label: 'Noépé', count: 22, color: '#D21034' },
  { code: 'TO', label: 'Tohoum', count: 18, color: '#e63050' },
  { code: 'KE', label: 'Kétao', count: 15, color: '#FFDF00' },
  { code: 'KA', label: 'Kambolé', count: 12, color: '#e6c800' },
  { code: 'KW', label: 'Kwodjoviakope', count: 10, color: '#3b6dbf' },
  { code: 'S/C', label: 'Sanvi condji', count: 8, color: '#7c4dff' },
  { code: 'POL', label: 'Réexportation', count: 6, color: '#ff6e40' },
]

const TYPES = [
  { type: 'Voiture', count: 72, color: '#006A4E' },
  { type: 'Camion', count: 58, color: '#D21034' },
  { type: 'Bus', count: 34, color: '#FFDF00' },
  { type: 'Pick-up', count: 21, color: '#3b6dbf' },
  { type: 'Moto', count: 11, color: '#7c4dff' },
]

const SEMAINE = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const semaineCounts = [24, 31, 18, 42, 35, 15, 7]
const maxSemaine = Math.max(...semaineCounts)

const MOIS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun']
const moisCounts = [180, 210, 195, 240, 228, 196]
const maxMois = Math.max(...moisCounts)

const totalVehicules = DESTINATIONS.reduce((s, d) => s + d.count, 0)
const totalRecettes = totalVehicules * 10000

export default function StatistiquesPage(): JSX.Element {
  const [periode, setPeriode] = useState<'semaine' | 'mois'>('semaine')

  const labels = periode === 'semaine' ? SEMAINE : MOIS
  const counts = periode === 'semaine' ? semaineCounts : moisCounts
  const maxVal = periode === 'semaine' ? maxSemaine : maxMois

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0, color: '#006A4E' }}>Statistiques</Title>
        <Select
          value={periode}
          onChange={setPeriode}
          options={[
            { value: 'semaine', label: 'Cette semaine' },
            { value: 'mois', label: 'Cette année' }
          ]}
          style={{ width: 160 }}
        />
      </div>

      {/* KPIs */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {[
          { title: 'Total véhicules', value: totalVehicules, icon: <CarOutlined />, color: '#006A4E', suffix: '' },
          { title: 'Recettes totales', value: totalRecettes, icon: <DollarOutlined />, color: '#D21034', suffix: ' FCFA' },
          { title: 'Destinations actives', value: 10, icon: <EnvironmentOutlined />, color: '#3b6dbf', suffix: '' },
          { title: 'Agents actifs', value: 3, icon: <UserOutlined />, color: '#7c4dff', suffix: '' },
        ].map((kpi, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
            >
              <Card style={{ borderRadius: 10, borderTop: `3px solid ${kpi.color}` }} bodyStyle={{ padding: '16px 20px' }}>
                <Statistic
                  title={kpi.title}
                  value={kpi.value}
                  suffix={kpi.suffix}
                  prefix={<span style={{ color: kpi.color, marginRight: 6 }}>{kpi.icon}</span>}
                  valueStyle={{ color: kpi.color, fontWeight: 700, fontSize: 22 }}
                  formatter={v => kpi.suffix === ' FCFA' ? Number(v).toLocaleString('fr-FR') : String(v)}
                />
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Graphique en barres — activité */}
        <Col xs={24} lg={14}>
          <Card
            title={<Text strong style={{ color: '#006A4E' }}>Activité — {periode === 'semaine' ? 'semaine en cours' : 'année en cours'}</Text>}
            style={{ borderRadius: 10, height: '100%' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 180, paddingBottom: 8 }}>
              {labels.map((label, i) => (
                <div key={label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  <Text style={{ fontSize: 11, color: '#006A4E', fontWeight: 700 }}>{counts[i]}</Text>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(counts[i] / maxVal) * 140}px` }}
                    transition={{ duration: 0.5, delay: i * 0.05 }}
                    style={{
                      width: '100%',
                      background: i === new Date().getDay() - 1
                        ? 'linear-gradient(180deg, #006A4E, #004A35)'
                        : 'linear-gradient(180deg, #3d9e7e, #006A4E88)',
                      borderRadius: '4px 4px 0 0',
                      minHeight: 4
                    }}
                  />
                  <Text style={{ fontSize: 11, color: '#888' }}>{label}</Text>
                </div>
              ))}
            </div>
          </Card>
        </Col>

        {/* Répartition par type de véhicule */}
        <Col xs={24} lg={10}>
          <Card
            title={<Text strong style={{ color: '#006A4E' }}>Par type de véhicule</Text>}
            style={{ borderRadius: 10, height: '100%' }}
          >
            {TYPES.map(t => (
              <div key={t.type} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <Text style={{ fontSize: 13 }}>{t.type}</Text>
                  <Text style={{ fontSize: 12, color: '#888' }}>{t.count}</Text>
                </div>
                <Progress
                  percent={Math.round((t.count / 196) * 100)}
                  strokeColor={t.color}
                  showInfo={false}
                  size="small"
                />
              </div>
            ))}
          </Card>
        </Col>

        {/* Tableau destinations */}
        <Col xs={24}>
          <Card
            title={<Text strong style={{ color: '#006A4E' }}>Répartition par destination</Text>}
            style={{ borderRadius: 10 }}
            bodyStyle={{ padding: 0 }}
          >
            <Table
              dataSource={DESTINATIONS}
              rowKey="code"
              size="small"
              pagination={false}
              columns={[
                {
                  title: 'Code', dataIndex: 'code', width: 70,
                  render: v => <strong style={{ color: '#006A4E' }}>{v}</strong>
                },
                { title: 'Frontière', dataIndex: 'label' },
                {
                  title: 'Véhicules', dataIndex: 'count', width: 100, align: 'center',
                  render: v => <strong>{v}</strong>
                },
                {
                  title: 'Part', dataIndex: 'count', width: 180,
                  render: (v) => (
                    <Progress
                      percent={Math.round((v / totalVehicules) * 100)}
                      strokeColor="#006A4E"
                      size="small"
                      style={{ margin: 0 }}
                    />
                  )
                },
                {
                  title: 'Recettes', dataIndex: 'count', width: 130, align: 'right',
                  render: v => <span style={{ color: '#D21034', fontWeight: 600 }}>
                    {(v * 10000).toLocaleString('fr-FR')} F
                  </span>
                }
              ]}
            />
          </Card>
        </Col>
      </Row>
    </motion.div>
  )
}
