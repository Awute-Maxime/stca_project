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
      background: appColors.sidebarBg,
      display: 'flex',
      flexDirection: 'column',
      padding: '8px 0',
      gap: 4,
      overflowY: 'auto',
    }}>
      {SIDEBAR_ITEMS.map(item => {
        const isActive = item.id === activeId
        return (
          <button
            key={item.id}
            aria-label={item.label}
            onClick={() => onSelect(item.id)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '14px 8px',
              margin: '0 6px',
              border: 'none',
              borderRadius: 6,
              background: isActive ? appColors.sidebarActiveBg : 'transparent',
              color: appColors.sidebarText,
              cursor: 'pointer',
              transition: 'background 0.15s',
              fontSize: 10,
              fontWeight: 600,
              lineHeight: 1.3,
              textAlign: 'center',
            }}
            onMouseEnter={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = appColors.sidebarHoverBg
            }}
            onMouseLeave={e => {
              if (!isActive) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            }}
          >
            <span style={{ fontSize: 22 }}>{item.icon}</span>
            <span>{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
