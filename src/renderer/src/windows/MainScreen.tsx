import { useEffect, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import MenuBar from '@components/shell/MenuBar'
import StatusBar from '@components/shell/StatusBar'
import NavSidebar, { type SidebarItem } from '@components/shell/NavSidebar'
import DashboardHome from '@pages/DashboardHome'
import AnalysePage from '@pages/AnalysePage'
import { MontantRestituerWindow } from '@pages/AssuranceWindows'
import ClefAdminFlow from '@pages/ClefAdminFlow'
import MdpAdminGate from '@pages/MdpAdminGate'
import { WinConfirm } from '@components/WinDialogs'
import { WINDOW_REGISTRY } from './WINDOW_REGISTRY'
import { useVehicules } from '@mock/vehiculesStore'
import { electronApi } from '@api/electron'
import dayjs from 'dayjs'

interface MainScreenProps {
  utilisateurLogin: string
}

// Fenêtres secondaires PRINCIPALES (une seule à la fois) — les fenêtres
// liées (aperçus avant impression) ne sont pas concernées
// Fenêtres liées (aperçus, éditions ouvertes depuis une fenêtre principale) :
// exclues de la règle « une seule fenêtre principale à la fois »
const estFenetrePrincipale = (id: string): boolean =>
  !id.startsWith('apercu.') && !id.startsWith('edition.')

// Son d'alerte (carillon bref à deux notes — WebAudio, aucun fichier requis)
function sonAlerte(): void {
  try {
    const ctx = new AudioContext()
    const jouer = (freq: number, t0: number): void => {
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.connect(g); g.connect(ctx.destination)
      o.type = 'sine'; o.frequency.value = freq
      g.gain.setValueAtTime(0.0001, ctx.currentTime + t0)
      g.gain.exponentialRampToValueAtTime(0.16, ctx.currentTime + t0 + 0.02)
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t0 + 0.30)
      o.start(ctx.currentTime + t0); o.stop(ctx.currentTime + t0 + 0.32)
    }
    jouer(880, 0)
    jouer(660, 0.13)
    setTimeout(() => ctx.close(), 700)
  } catch { /* audio indisponible — silencieux */ }
}

export default function MainScreen({ utilisateurLogin }: MainScreenProps): JSX.Element {
  const vehicules = useVehicules() // store partagé — synchro auto (statusbar)
  const location = useLocation()
  const navigate = useNavigate()
  const logout = useAuthStore(s => s.logout)
  const [analyseOpen, setAnalyseOpen] = useState(false)
  const [assuranceOpen, setAssuranceOpen] = useState(false)
  const [clefAdminOpen, setClefAdminOpen] = useState(false)
  // Fenêtres réservées à l'Administrateur (Règle 17) : id → message de la garde
  const FENETRES_ADMIN: Record<string, string> = {
    'outils.archivage':
      "L'archivage des enregistrements est réservé à l'Administrateur de TCIT. Donnez le mot de passe de forçage pour continuer.",
    'outils.configAssurances':
      "La configuration des assurances (assureurs, tarifs, commissions) est réservée à l'Administrateur de TCIT. Donnez le mot de passe de forçage pour continuer.",
    'outils.typesVehicule':
      "La gestion des types de véhicule (catégories de l'enregistrement et des assurances) est réservée à l'Administrateur de TCIT. Donnez le mot de passe de forçage pour continuer.",
    'outils.paramDestinations':
      "Les paramètres de destination (tarifs, n° d'immatriculation, couleurs de plaque) sont réservés à l'Administrateur de TCIT. Donnez le mot de passe de forçage pour continuer.",
  }
  const [gateAdminId, setGateAdminId] = useState<string | null>(null)
  // Confirmation de bascule entre fenêtres principales
  const [switchConfirm, setSwitchConfirm] = useState<{ msg: ReactNode; cb: () => void; nonCb: () => void } | null>(null)

  const doOpen = (id: string): void => {
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

  const openById = (id: string): void => {
    if (id === 'analyse' || id === 'analyse.stca') {
      setAnalyseOpen(true)
      return
    }
    if (id === 'assurances.montantRestituer') {
      setAssuranceOpen(true)
      return
    }
    if (id === 'outils.clefAdmin') {
      // Clef d'administration — flux mot de passe + configuration en overlay (Règle 17)
      setClefAdminOpen(true)
      return
    }
    if (FENETRES_ADMIN[id]) {
      // Fenêtre réservée à l'Administrateur : mot de passe requis (Règle 17)
      setGateAdminId(id)
      return
    }
    ouvrirAvecExclusivite(id)
  }

  const ouvrirAvecExclusivite = (id: string): void => {
    const config = WINDOW_REGISTRY[id]
    if (!config) return

    // Une seule fenêtre secondaire PRINCIPALE à la fois : si une autre est
    // déjà ouverte, on le signale (son + confirmation) avant de la fermer
    if (estFenetrePrincipale(id)) {
      void electronApi.mdiListOpen().then(ouvertes => {
        const autres = ouvertes.filter(wid => estFenetrePrincipale(wid) && wid !== id)
        if (autres.length === 0) { doOpen(id); return }
        const noms = autres.map(wid => WINDOW_REGISTRY[wid]?.title ?? wid).join(' », « ')
        sonAlerte()
        setSwitchConfirm({
          msg: (
            <>
              La fenêtre « <strong>{noms}</strong> » est actuellement ouverte.
              <br />Elle sera fermée pour ouvrir « <strong>{config.title}</strong> ».
              <br />Voulez-vous continuer ?
            </>
          ),
          cb: () => {
            autres.forEach(wid => electronApi.mdiCloseId(wid))
            doOpen(id)
            setSwitchConfirm(null)
          },
          nonCb: () => {
            // Annulation : on ramène la fenêtre restée ouverte au premier
            // plan (mdiOpen sur un id déjà ouvert = restore + focus)
            autres.forEach(wid => doOpen(wid))
            setSwitchConfirm(null)
          },
        })
      })
      return
    }
    doOpen(id)
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
      {clefAdminOpen && <ClefAdminFlow onClose={() => setClefAdminOpen(false)} />}
      {gateAdminId && (
        <MdpAdminGate
          titre="Saisie 'Mot de passe' de Configuration"
          message={FENETRES_ADMIN[gateAdminId]}
          onOk={() => { const id = gateAdminId; setGateAdminId(null); ouvrirAvecExclusivite(id) }}
          onClose={() => setGateAdminId(null)}
        />
      )}
      {switchConfirm && (
        <WinConfirm message={switchConfirm.msg} onOui={switchConfirm.cb} onNon={switchConfirm.nonCb} />
      )}
    </div>
  )
}
