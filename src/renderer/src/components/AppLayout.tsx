import { ReactNode, useState } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography } from 'antd'
import {
  FileAddOutlined,
  UnorderedListOutlined,
  BarChartOutlined,
  CarOutlined,
  LogoutOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuthStore } from '@store/authStore'

const { Sider, Content, Header } = Layout
const { Text } = Typography

interface AppLayoutProps {
  children: ReactNode
}

const menuItems = [
  { key: '/', icon: <FileAddOutlined />, label: 'Accueil' },
  { key: '/enregistrement', icon: <CarOutlined />, label: 'Enregistrement' },
  { key: '/liste', icon: <UnorderedListOutlined />, label: 'Liste véhicules' },
  { key: '/statistiques', icon: <BarChartOutlined />, label: 'Statistiques' },
]

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const userMenu = {
    items: [
      { key: 'logout', icon: <LogoutOutlined />, label: 'Déconnexion', danger: true }
    ],
    onClick: ({ key }: { key: string }) => {
      if (key === 'logout') { logout(); navigate('/login') }
    }
  }

  return (
    <Layout style={{ height: '100vh' }}>
      {/* Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        trigger={null}
        width={220}
        style={{ background: 'linear-gradient(180deg, #006A4E 0%, #004A35 100%)' }}
      >
        {/* Logo zone */}
        <div style={{
          padding: collapsed ? '16px 8px' : '20px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          transition: 'padding 0.2s'
        }}>
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div key="small" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Text style={{ color: '#FFDF00', fontWeight: 900, fontSize: 20, letterSpacing: 2 }}>TC</Text>
              </motion.div>
            ) : (
              <motion.div key="full" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <Text style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 22, letterSpacing: 4 }}>TCIT</Text>
                <br />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, letterSpacing: 0.5 }}>
                  Contrôle · Immatriculation · Transit
                </Text>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          onClick={({ key }) => navigate(key)}
          items={menuItems}
          style={{
            background: 'transparent',
            border: 'none',
            marginTop: 8
          }}
          theme="dark"
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header style={{
          background: '#fff',
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          height: 52
        }}>
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#006A4E' }}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>

          <Dropdown menu={userMenu} placement="bottomRight">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <Avatar size={32} icon={<UserOutlined />} style={{ background: '#006A4E' }} />
              <Text style={{ fontSize: 13, fontWeight: 500 }}>{user?.nom ?? 'Utilisateur'}</Text>
            </div>
          </Dropdown>
        </Header>

        {/* Contenu */}
        <Content style={{ overflow: 'auto', padding: 24, background: '#f0f2f5' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              style={{ height: '100%' }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </Content>
      </Layout>
    </Layout>
  )
}
