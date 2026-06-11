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
        <div style={{ flex: 1, background: appColors.desktopBg, overflow: 'hidden' }}>
          <DashboardHome />
        </div>
      </div>

      <StatusBar nbVehiculesAujourdhui={
        mockVehicules.filter(v => dayjs(v.date).isSame(dayjs(), 'day')).length
      } />
    </div>
  )
}
