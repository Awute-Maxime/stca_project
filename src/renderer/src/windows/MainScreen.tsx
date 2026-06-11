import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { appColors } from '@theme/windev-theme'
import MenuBar from '@components/shell/MenuBar'
import StatusBar from '@components/shell/StatusBar'
import NavSidebar, { type SidebarItem } from '@components/shell/NavSidebar'
import DashboardHome from '@pages/DashboardHome'
import { WINDOW_REGISTRY } from './WINDOW_REGISTRY'
import { mockVehicules } from '@mock/vehicules'
import { electronApi } from '@api/electron'
import dayjs from 'dayjs'

interface MainScreenProps {
  utilisateurLogin: string
}

export default function MainScreen({ utilisateurLogin }: MainScreenProps): JSX.Element {
  const location = useLocation()

  const openById = (id: string): void => {
    const config = WINDOW_REGISTRY[id]
    if (!config) return
    // Chaque fenêtre MDI = une BrowserWindow Electron séparée
    electronApi.mdiOpen({
      id,
      x: config.defaultX,
      y: config.defaultY,
      width:  config.width,
      height: config.height,
    })
  }

  useEffect(() => {
    const state = location.state as { autoOpen?: string } | null
    if (state?.autoOpen && WINDOW_REGISTRY[state.autoOpen]) {
      setTimeout(() => openById(state.autoOpen!), 400)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSidebarSelect = (id: SidebarItem['id']): void => openById(id)

  const handleMenuItemClick = (key: string): void => {
    if (WINDOW_REGISTRY[key]) openById(key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <MenuBar utilisateurLogin={utilisateurLogin} onMenuItemClick={handleMenuItemClick} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavSidebar onSelect={handleSidebarSelect} activeId={undefined} />

        {/* Bureau MDI — dashboard en fond, les BrowserWindows flottent par-dessus */}
        <div style={{
          flex: 1,
          background: '#EEF2F9',
          backgroundImage: 'radial-gradient(circle, rgba(27,58,107,0.07) 1px, transparent 1px)',
          backgroundSize: '22px 22px',
          overflow: 'hidden',
        }}>
          <DashboardHome />
        </div>
      </div>

      <StatusBar nbVehiculesAujourdhui={
        mockVehicules.filter(v => dayjs(v.date).isSame(dayjs(), 'day')).length
      } />
    </div>
  )
}
