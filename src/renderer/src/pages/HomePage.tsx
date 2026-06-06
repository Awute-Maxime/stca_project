import { Card, Row, Col, Statistic } from 'antd'
import { CarOutlined, CheckCircleOutlined, ClockCircleOutlined, GlobalOutlined } from '@ant-design/icons'
import { motion } from 'framer-motion'
import { useAuthStore } from '@store/authStore'

const stats = [
  { title: 'Véhicules aujourd\'hui', value: 0, icon: <CarOutlined />, color: '#006A4E' },
  { title: 'En attente', value: 0, icon: <ClockCircleOutlined />, color: '#FFDF00' },
  { title: 'Traités', value: 0, icon: <CheckCircleOutlined />, color: '#52c41a' },
  { title: 'Frontières actives', value: 0, icon: <GlobalOutlined />, color: '#D21034' }
]

export default function HomePage(): JSX.Element {
  const user = useAuthStore((s) => s.user)

  return (
    <div>
      {/* Message de bienvenue */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
        style={{ marginBottom: 24 }}
      >
        <h2 style={{ color: '#006A4E', fontWeight: 700, fontSize: 22, margin: 0 }}>
          Bonjour, {user?.nom ?? 'Agent'} 👋
        </h2>
        <p style={{ color: '#888', marginTop: 4 }}>
          Système de Contrôle et d'Immatriculation Transit — Togo
        </p>
      </motion.div>

      {/* Cartes statistiques */}
      <Row gutter={[16, 16]}>
        {stats.map((stat, i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Card
                style={{ borderRadius: 10, borderTop: `3px solid ${stat.color}` }}
                bodyStyle={{ padding: '20px 24px' }}
              >
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  prefix={<span style={{ color: stat.color, marginRight: 8 }}>{stat.icon}</span>}
                  valueStyle={{ color: stat.color, fontWeight: 700 }}
                />
              </Card>
            </motion.div>
          </Col>
        ))}
      </Row>

      {/* Actions rapides */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        style={{ marginTop: 24 }}
      >
        <Card title="Actions rapides" style={{ borderRadius: 10 }}>
          <p style={{ color: '#999', textAlign: 'center', padding: '20px 0' }}>
            Modules en cours de développement — Phase 3
          </p>
        </Card>
      </motion.div>
    </div>
  )
}
