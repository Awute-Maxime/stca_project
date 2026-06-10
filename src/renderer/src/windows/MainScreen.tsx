import { appColors } from '@theme/windev-theme'
import { useWindowStore } from '@store/windowStore'
import MenuBar from '@components/shell/MenuBar'
import StatusBar from '@components/shell/StatusBar'
import NavSidebar, { type SidebarItem } from '@components/shell/NavSidebar'
import MdiWindow from '@components/shell/MdiWindow'
import { WINDOW_REGISTRY } from './WINDOW_REGISTRY'

interface MainScreenProps {
  utilisateurLogin: string
}

export default function MainScreen({ utilisateurLogin }: MainScreenProps): JSX.Element {
  const windows    = useWindowStore(s => s.windows)
  const openWindow = useWindowStore(s => s.openWindow)

  const openById = (id: string): void => {
    const config = WINDOW_REGISTRY[id]
    if (!config) return
    openWindow(id, config)
  }

  const handleSidebarSelect = (id: SidebarItem['id']): void => openById(id)

  const handleMenuItemClick = (key: string): void => {
    // Ignorer les clés de menus parents (ex: "fichier") — seules les feuilles ouvrent une fenêtre
    if (WINDOW_REGISTRY[key]) openById(key)
  }

  const openWindowIds = Object.keys(windows).filter(id => windows[id].isOpen)

  const lastOpenId = openWindowIds.length > 0
    ? openWindowIds.reduce((a, b) => windows[a].zIndex > windows[b].zIndex ? a : b)
    : undefined

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <MenuBar utilisateurLogin={utilisateurLogin} onMenuItemClick={handleMenuItemClick} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavSidebar onSelect={handleSidebarSelect} activeId={lastOpenId} />

        <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: appColors.desktopBg }}>
          {openWindowIds.map(id => (
            <MdiWindow key={id} id={id}>
              <p style={{ fontSize: 13, color: '#555' }}>
                {`Contenu à venir — fenêtre "${windows[id].title}" sera développée dans un plan ultérieur.`}
              </p>
            </MdiWindow>
          ))}
        </div>
      </div>

      <StatusBar nbVehiculesAujourdhui={0} />
    </div>
  )
}
