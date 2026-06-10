import { Menu } from 'antd'
import type { MenuProps } from 'antd'
import { appColors } from '@theme/windev-theme'

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
      { key: 'analyse.stca', label: 'Edition des rapports d\'analyse — STCA' },
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
      { key: 'outils.clefAdmin', label: 'Clef d\'administration' },
      { key: 'outils.archivage', label: 'Archivage' },
      { key: 'outils.fixerRef', label: 'Fixer N° Référence' },
      { key: 'outils.impressionPlaque', label: 'Impression de plaque d\'immatriculation', disabled: true },
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
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Barre de titre — chrome Windows natif gris clair */}
      <div style={{
        height: 30,
        background: appColors.windowChromeBg,
        borderBottom: '1px solid #D4D4D4',
        display: 'flex',
        alignItems: 'center',
        padding: '0 10px',
        fontSize: 12,
        color: appColors.windowChromeText,
        gap: 24
      }}>
        <span style={{ fontWeight: 600 }}>STCA : Enregistrement des Véhicules</span>
        <span style={{ color: '#666' }}>{`utilisateur connecté : ${utilisateurLogin}`}</span>
        <span style={{ color: '#666' }}>utilisateur avec pouvoir : OUI</span>
      </div>

      {/* Barre de menus — fond blanc, liens bleus */}
      <Menu
        mode="horizontal"
        selectable={false}
        items={items}
        onClick={({ key }) => onMenuItemClick(key)}
        style={{
          background: appColors.menuBarBg,
          borderBottom: '1px solid #D4D4D4',
          color: appColors.menuBarText,
          fontSize: 13,
          lineHeight: '32px'
        }}
      />
    </div>
  )
}
