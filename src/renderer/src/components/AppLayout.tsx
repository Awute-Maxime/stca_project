import { ReactNode, useState, useEffect } from 'react'
import { Layout, Menu, Avatar, Dropdown, Typography, Tooltip } from 'antd'
import {
  UnorderedListOutlined, BarChartOutlined, CarOutlined,
  LogoutOutlined, UserOutlined, MenuFoldOutlined, MenuUnfoldOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@store/authStore'
import { useWindowStore, WindowId } from '@store/windowStore'

const { Sider, Content, Header, Footer } = Layout
const { Text } = Typography

interface AppLayoutProps { children: ReactNode }

const MENU_ITEMS = [
  { key: 'enregistrement', icon: <CarOutlined />,           label: 'Enregistrer un véhicule' },
  { key: 'liste',          icon: <UnorderedListOutlined />, label: 'Liste des véhicules' },
  { key: 'statistiques',   icon: <BarChartOutlined />,      label: 'Statistiques / Analyse' },
]

function Clock(): JSX.Element {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  return (
    <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>
      {time.toLocaleDateString('fr-FR')} — {time.toLocaleTimeString('fr-FR')}
    </span>
  )
}

export default function AppLayout({ children }: AppLayoutProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const navigate    = useNavigate()
  const { user, logout } = useAuthStore()
  const windows     = useWindowStore(s => s.windows)
  const openWindow  = useWindowStore(s => s.openWindow)
  const focusWindow = useWindowStore(s => s.focusWindow)

  const openKeys = (Object.keys(windows) as WindowId[]).filter(id => windows[id].isOpen)

  const handleMenuClick = ({ key }: { key: string }): void => {
    const id = key as WindowId
    if (windows[id]?.isOpen) focusWindow(id)
    else openWindow(id)
  }

  const userMenu = {
    items: [{ key: 'logout', icon: <LogoutOutlined />, label: 'Déconnexion', danger: true }],
    onClick: ({ key }: { key: string }) => { if (key === 'logout') { logout(); navigate('/login') } }
  }

  return (
    <Layout style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Layout style={{ flex: 1, overflow: 'hidden' }}>

        {/* ── Sidebar ─────────────────────────────────────────────── */}
        <Sider
          collapsible collapsed={collapsed} trigger={null} width={220}
          style={{
            background: 'linear-gradient(180deg, #1C3A20 0%, #0F2213 60%, #081508 100%)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
            display: 'flex', flexDirection: 'column',
          }}
        >
          {/* Logo */}
          <div style={{
            padding: collapsed ? '14px 10px' : '18px 16px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            transition: 'padding 0.2s',
          }}>
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center' }}>
                  <Text style={{ color: '#FFDF00', fontWeight: 900, fontSize: 18, letterSpacing: 2 }}>TC</Text>
                </motion.div>
              ) : (
                <motion.div key="f" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <Text style={{ color: '#FFFFFF', fontWeight: 900, fontSize: 20, letterSpacing: 5 }}>TCIT</Text>
                  <br />
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 9, letterSpacing: 0.8 }}>
                    Contrôle · Immatriculation · Transit
                  </Text>
                  {/* Mini drapeau */}
                  <div style={{ display: 'flex', height: 2, marginTop: 8, borderRadius: 1, overflow: 'hidden', opacity: 0.7 }}>
                    <div style={{ flex: 1, background: '#006A4E' }} />
                    <div style={{ flex: 1, background: '#FFDF00' }} />
                    <div style={{ flex: 1, background: '#D21034' }} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div style={{ flex: 1 }}>
            <Menu
              mode="inline"
              selectedKeys={openKeys}
              onClick={handleMenuClick}
              items={MENU_ITEMS.map(item => ({
                ...item,
                label: collapsed ? (
                  <Tooltip title={item.label} placement="right">{item.label}</Tooltip>
                ) : item.label
              }))}
              style={{ background: 'transparent', border: 'none', marginTop: 6 }}
              theme="dark"
            />
          </div>

          {/* Indicateur connexion HFSQL */}
          {!collapsed && (
            <div style={{
              padding: '8px 14px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <SafetyCertificateOutlined style={{ color: '#4CAF50', fontSize: 12 }} />
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontSize: 10 }}>
                Mode Client / Serveur
              </Text>
            </div>
          )}
        </Sider>

        <Layout style={{ display: 'flex', flexDirection: 'column' }}>

          {/* ── Header ──────────────────────────────────────────── */}
          <Header style={{
            background: 'linear-gradient(90deg, #1A3020 0%, #0F1F12 100%)',
            padding: '0 16px',
            height: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 6px rgba(0,0,0,0.3)',
            flexShrink: 0,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                onClick={() => setCollapsed(!collapsed)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', fontSize: 16 }}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </button>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, letterSpacing: 0.5 }}>
                STCA — Enregistrement des Véhicules
              </Text>
            </div>

            <Dropdown menu={userMenu} placement="bottomRight">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
                  utilisateur connecté :
                </Text>
                <Avatar size={26} icon={<UserOutlined />} style={{ background: '#2D6A4F', fontSize: 12 }} />
                <Text style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                  {user?.login ?? 'awute'}
                </Text>
                <Text style={{ fontSize: 11, color: 'rgba(255,220,0,0.7)', marginLeft: 4 }}>
                  · pouvoir : OUI
                </Text>
              </div>
            </Dropdown>
          </Header>

          {/* ── Zone MDI ──────────────────────────────────────── */}
          <Content style={{ overflow: 'hidden', padding: 0, position: 'relative', flex: 1 }}>
            {children}
          </Content>

        </Layout>
      </Layout>

      {/* ── Status bar (bas, sur toute la largeur) ────────────── */}
      <div style={{
        height: 22,
        background: 'linear-gradient(90deg, #0F2213 0%, #1A3020 100%)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 0,
        flexShrink: 0,
      }}>
        <StatusItem text="Fonctionnement en Mode Client / Serveur" borderRight />
        <StatusItem text="Nbr de véhicule(s) enregistré(s) aujourd'hui : 0" borderRight flex />
        <StatusItem>
          <Clock />
        </StatusItem>
      </div>
    </Layout>
  )
}

function StatusItem({ text, children, borderRight, flex }: {
  text?: string; children?: ReactNode; borderRight?: boolean; flex?: boolean
}): JSX.Element {
  return (
    <div style={{
      padding: '0 10px',
      borderRight: borderRight ? '1px solid rgba(255,255,255,0.1)' : undefined,
      fontSize: 11,
      color: 'rgba(255,255,255,0.45)',
      whiteSpace: 'nowrap',
      flex: flex ? 1 : undefined,
    }}>
      {text ?? children}
    </div>
  )
}
