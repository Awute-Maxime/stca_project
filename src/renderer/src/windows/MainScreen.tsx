import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import MenuBar from '@components/shell/MenuBar'
import StatusBar from '@components/shell/StatusBar'
import NavSidebar, { type SidebarItem } from '@components/shell/NavSidebar'
import DashboardHome from '@pages/DashboardHome'
import AnalysePage from '@pages/AnalysePage'
import { MontantRestituerWindow } from '@pages/AssuranceWindows'
import { WINDOW_REGISTRY } from './WINDOW_REGISTRY'
import { useVehicules } from '@mock/vehiculesStore'
import { electronApi } from '@api/electron'
import dayjs from 'dayjs'

interface MainScreenProps {
  utilisateurLogin: string
}

export default function MainScreen({ utilisateurLogin }: MainScreenProps): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto (statusbar)
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const [analyseOpen, setAnalyseOpen] = useState(false)
  const [assuranceOpen, setAssuranceOpen] = useState(false)

  const openById = (id: string): void => {
    if (id === 'analyse' || id === 'analyse.stca') {
      setAnalyseOpen(true)
      return
    }
    if (id === 'assurances.montantRestituer') {
      setAssuranceOpen(true)
      return
    }
    const config = WINDOW_REGISTRY[id]
    if (!config) return
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
    if (key === 'analyse' || key === 'analyse.stca') {
      setAnalyseOpen(true)
      return
    }
    if (key === 'fichier.fermerSession') {
      electronApi.resizeForLogin()
      logout()
      navigate('/login')
      return
    }
    if (key === 'fichier.quitter') {
      electronApi.closeWindow()
      return
    }
    if (WINDOW_REGISTRY[key]) openById(key)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw' }}>
      <MenuBar utilisateurLogin={utilisateurLogin} onMenuItemClick={handleMenuItemClick} />

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <NavSidebar onSelect={handleSidebarSelect} activeId={undefined} />

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
        vehicules.filter(v => dayjs(v.date).isSame(dayjs(), 'day')).length
      } />

      {analyseOpen && <AnalysePage onClose={() => setAnalyseOpen(false)} />}
      {assuranceOpen && <MontantRestituerWindow onClose={() => setAssuranceOpen(false)} />}
    </div>
  )
}
