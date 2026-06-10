import EnregistrementPage from '@pages/EnregistrementPage'
import ListePage from '@pages/ListePage'
import RechercheWindow from '@pages/RechercheWindow'
import { CopyrightWindow, VersionWindow, IdReseauWindow } from '@pages/InfoWindows'

const placeholder = (label: string): JSX.Element => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13 }}>
    {label} — à implémenter
  </div>
)

export function renderWindowContent(id: string): JSX.Element {
  switch (id) {
    // Fenêtres principales (sidebar)
    case 'enregistrement':
      return <EnregistrementPage />
    case 'enregistrements.listeChassis':
    case 'fichier.marques':
    case 'listeVehicules':
      return <ListePage />
    case 'rechercheImmat':
      return <RechercheWindow mode="immat" />
    case 'rechercheChassis':
      return <RechercheWindow mode="chassis" />

    // Analyse
    case 'analyse':
    case 'analyse.stca':
      return placeholder('Rapports d\'analyse STCA')
    case 'analyse.assurance':
      return placeholder('Gain généré par les assurances')

    // Assurances
    case 'assurances.montantRestituer':
      return placeholder('Montant à restituer')

    // Destination
    case 'destination':
      return placeholder('Nombre de véhicules par frontières')

    // Outils
    case 'outils.clefAdmin':
      return placeholder('Clef d\'administration')
    case 'outils.archivage':
      return placeholder('Enregistrements archivés')
    case 'outils.fixerRef':
      return placeholder('Fixer N° Référence')
    case 'outils.posteImmat':
      return placeholder('Configuration poste N° IMMAT')
    case 'outils.configAssurances':
      return placeholder('Configuration Assurances')
    case 'outils.typesVehicule':
      return placeholder('Types Véhicule')
    case 'outils.paramDestinations':
      return placeholder('Paramètres Destinations')
    case 'outils.configImprimantes':
      return placeholder('Configuration Imprimantes')
    case 'outils.exporter':
      return placeholder('Exportation des enregistrements')
    case 'outils.pointage':
      return placeholder('Pointage / Dépointage')

    // Aide
    case 'aide.copyright':
      return <CopyrightWindow />
    case 'aide.version':
      return <VersionWindow />
    case 'aide.idReseau':
      return <IdReseauWindow />

    default:
      return placeholder(id)
  }
}
