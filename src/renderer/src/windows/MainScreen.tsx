import { winDevColors } from '@theme/windev-theme'
import { useWindowStore } from '@store/windowStore'
import MenuBar from '@components/shell/MenuBar'
import StatusBar from '@components/shell/StatusBar'
import NavigationWheel, { type WheelItem } from '@components/shell/NavigationWheel'
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

  const handleWheelSelect = (id: WheelItem['id']): void => openById(id)

  const handleMenuItemClick = (key: string): void => {
    // Ignorer les clés de menus parents (ex: "fichier") — seules les feuilles ouvrent une fenêtre
    if (WINDOW_REGISTRY[key]) openById(key)
  }

  const openWindowIds = Object.keys(windows).filter(id => windows[id].isOpen)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <MenuBar utilisateurLogin={utilisateurLogin} onMenuItemClick={handleMenuItemClick} />

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', background: winDevColors.desktopBg }}>
        {openWindowIds.length === 0 && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <NavigationWheel onSelect={handleWheelSelect} />
          </div>
        )}

        {openWindowIds.map(id => (
          <MdiWindow key={id} id={id}>
            <p style={{ fontSize: 13, color: '#555' }}>
              {`Contenu à venir — fenêtre "${windows[id].title}" sera développée dans un plan ultérieur.`}
            </p>
          </MdiWindow>
        ))}
      </div>

      <StatusBar nbVehiculesAujourdhui={0} />
    </div>
  )
}
