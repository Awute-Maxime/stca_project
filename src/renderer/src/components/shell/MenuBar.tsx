import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { appColors } from '@theme/windev-theme'
import { electronApi } from '@api/electron'

type DragCSS = React.CSSProperties & { WebkitAppRegion?: 'drag' | 'no-drag' }

interface MenuBarProps {
  utilisateurLogin: string
  onMenuItemClick: (key: string) => void
}

const items: MenuProps['items'] = [
  {
    key: 'fichier',
    label: 'Fichier',
    children: [
      { key: 'fichier.marques', label: 'Marques et modèles de véhicules' },
      { key: 'fichier.fermerSession', label: 'Fermer la session' },
      { key: 'fichier.quitter', label: 'Quitter' }
    ]
  },
  {
    key: 'enregistrements',
    label: 'Enregistrements des véhicules',
    children: [
      { key: 'enregistrements.listeChassis', label: 'Liste véhicules par N°Chassis (VIN)' }
    ]
  },
  {
    key: 'analyse',
    label: 'Analyse',
    children: [
      { key: 'analyse.stca', label: "Edition des rapports d'analyse — TCIT" },
      { key: 'analyse.assurance', label: 'Gain généré par les assurances' }
    ]
  },
  {
    key: 'assurances',
    label: 'Assurances',
    children: [
      { key: 'assurances.montantRestituer', label: 'Montant à restituer' }
    ]
  },
  {
    key: 'outils',
    label: 'Outils+Config.',
    children: [
      { key: 'outils.sauvegardeBd', label: 'Sauvegarde la Base de Données', disabled: true },
      { key: 'outils.clefAdmin', label: "Clef d'administration" },
      { key: 'outils.archivage', label: 'Archivage' },
      { key: 'outils.fixerRef', label: 'Fixer N° Référence' },
      { key: 'outils.impressionPlaque', label: "Impression de plaque d'immatriculation", disabled: true },
      { key: 'outils.posteImmat', label: 'Config. Poste N° IMMAT.' },
      { key: 'outils.configAssurances', label: 'Configuration Assurances' },
      { key: 'outils.typesVehicule', label: 'Types Véhicule' },
      { key: 'outils.paramDestinations', label: 'Paramètres Destinations' },
      { key: 'outils.configImprimantes', label: 'Config. Imprimantes' },
      { key: 'outils.exporter', label: 'Exporter les enregistrements de véhicules' },
      { key: 'outils.pointage', label: 'Pointage des véhicules' }
    ]
  },
  {
    key: 'aide',
    label: '?',
    children: [
      { key: 'aide.copyright', label: 'Copyright' },
      { key: 'aide.version', label: 'Version' },
      { key: 'aide.idReseau', label: 'ID réseau' }
    ]
  }
]

export default function MenuBar({ utilisateurLogin, onMenuItemClick }: MenuBarProps): JSX.Element {
  const btnBase: React.CSSProperties = {
    width: 28, height: 28,
    border: 'none', borderRadius: 4,
    cursor: 'pointer', fontSize: 13,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    transition: 'background 0.15s',
    background: 'transparent',
    color: appColors.windowChromeText,
    flexShrink: 0,
  }

  return (
    <div style={{ flexShrink: 0 }}>
      {/* Barre de titre — draggable, chrome personnalisé */}
      <div style={{
        height: 32,
        background: appColors.windowChromeBg,
        borderBottom: '1px solid #D4D4D4',
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 12,
        paddingRight: 4,
        fontSize: 12,
        color: appColors.windowChromeText,
        WebkitAppRegion: 'drag',
        userSelect: 'none',
      } as DragCSS}>

        {/* Informations utilisateur */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ fontWeight: 700, fontSize: 12 }}>TCIT : Enregistrement des Véhicules</span>
          <span style={{ color: '#888', fontSize: 11 }}>{`utilisateur : ${utilisateurLogin}`}</span>
        </div>

        {/* Boutons de fenêtre — no-drag */}
        <div style={{
          display: 'flex', gap: 2, alignItems: 'center',
          WebkitAppRegion: 'no-drag',
        } as DragCSS}>
          {/* Réduire */}
          <button
            style={btnBase}
            title="Réduire"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E0E0E0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            onClick={electronApi.minimizeWindow}
          >
            <span style={{ fontSize: 16, lineHeight: 1, marginTop: -2 }}>−</span>
          </button>

          {/* Agrandir */}
          <button
            style={btnBase}
            title="Agrandir"
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#E0E0E0' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
            onClick={electronApi.maximizeWindow}
          >
            <span style={{ fontSize: 10, border: `1.5px solid ${appColors.windowChromeText}`, width: 10, height: 10, display: 'block' }} />
          </button>

          {/* Fermer */}
          <button
            style={{ ...btnBase, borderRadius: 4 }}
            title="Fermer"
            onMouseEnter={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = '#C42B1C'
              b.style.color = '#fff'
            }}
            onMouseLeave={e => {
              const b = e.currentTarget as HTMLButtonElement
              b.style.background = 'transparent'
              b.style.color = appColors.windowChromeText
            }}
            onClick={electronApi.closeWindow}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Barre de menus */}
      <Menu
        mode="horizontal"
        selectable={false}
        items={items}
        onClick={({ key }) => onMenuItemClick(key)}
        style={{
          background: appColors.menuBarBg,
          borderBottom: 'none',
          boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
          color: appColors.menuBarText,
          fontSize: 13,
          lineHeight: '32px',
        }}
      />
    </div>
  )
}
