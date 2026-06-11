import {
  FileAddOutlined,
  EnvironmentOutlined,
  BarChartOutlined,
  UnorderedListOutlined,
  SearchOutlined,
  CarOutlined,
} from '@ant-design/icons'
import type { ReactNode } from 'react'
import { appColors } from '@theme/windev-theme'

export interface SidebarItem {
  id: 'enregistrement' | 'destination' | 'analyse' | 'listeVehicules' | 'rechercheImmat' | 'rechercheChassis'
  label: string
  icon: ReactNode
}

export const SIDEBAR_ITEMS: SidebarItem[] = [
  { id: 'enregistrement',   label: 'Enregistrement',      icon: <FileAddOutlined /> },
  { id: 'destination',      label: 'Destination',         icon: <EnvironmentOutlined /> },
  { id: 'analyse',          label: 'Analyse',             icon: <BarChartOutlined /> },
  { id: 'listeVehicules',   label: 'Liste Véhicules',     icon: <UnorderedListOutlined /> },
  { id: 'rechercheImmat',   label: 'Recherche IMMAT.',    icon: <SearchOutlined /> },
  { id: 'rechercheChassis', label: 'Recherche N°Chassis', icon: <CarOutlined /> },
]

interface NavSidebarProps {
  onSelect: (id: SidebarItem['id']) => void
  activeId?: string
}

export default function NavSidebar({ onSelect, activeId }: NavSidebarProps): JSX.Element {
  return (
    <div style={{
      width: 100,
      flexShrink: 0,
      background: 'linear-gradient(180deg, #1E4080 0%, #112654 100%)',
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto',
      boxShadow: '2px 0 12px rgba(0,0,0,0.18)',
    }}>
      {/* Brand header */}
      <div style={{
        padding: '14px 8px 12px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        marginBottom: 6,
      }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: 'rgba(255,255,255,0.12)',
          border: '1px solid rgba(255,255,255,0.18)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 6px',
          fontSize: 18,
          color: '#fff',
        }}>
          🚗
        </div>
        <div style={{ color: '#93C5FD', fontSize: 9, fontWeight: 800, letterSpacing: 1.5 }}>TCIT</div>
      </div>

      {/* Nav items */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: '0 6px 8px' }}>
        {SIDEBAR_ITEMS.map(item => {
          const isActive = item.id === activeId
          return (
            <button
              key={item.id}
              aria-label={item.label}
              onClick={() => onSelect(item.id)}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '12px 6px',
                border: 'none',
                borderRadius: 8,
                background: isActive ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.70)',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                fontSize: 9.5,
                fontWeight: isActive ? 700 : 500,
                lineHeight: 1.3,
                textAlign: 'center',
                overflow: 'hidden',
              }}
              onMouseEnter={e => {
                if (!isActive) {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.background = 'rgba(255,255,255,0.08)'
                  b.style.color = '#fff'
                }
              }}
              onMouseLeave={e => {
                if (!isActive) {
                  const b = e.currentTarget as HTMLButtonElement
                  b.style.background = 'transparent'
                  b.style.color = 'rgba(255,255,255,0.70)'
                }
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <div style={{
                  position: 'absolute',
                  left: 0, top: '20%', bottom: '20%',
                  width: 3, borderRadius: '0 3px 3px 0',
                  background: '#60A5FA',
                }} />
              )}
              <span style={{ fontSize: 20 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
