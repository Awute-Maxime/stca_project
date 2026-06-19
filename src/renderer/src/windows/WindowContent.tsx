import EnregistrementPage from '@pages/EnregistrementPage'
import DestinationPage from '@pages/DestinationPage'
import AnalysePage from '@pages/AnalysePage'
import ListePage from '@pages/ListePage'
import ListeParDestPage from '@pages/ListeParDestPage'
import OpsParticulieresPage from '@pages/OpsParticulieresPage'
import RechercheWindow from '@pages/RechercheWindow'
import { CopyrightWindow, VersionWindow, IdReseauWindow } from '@pages/InfoWindows'
import FichierMarquesPage from '@pages/FichierMarquesPage'
import ArchivagePage from '@pages/ArchivagePage'
import PointagePage from '@pages/PointagePage'
import ExportPage from '@pages/ExportPage'
import { AnalyseAssuranceWindow, MontantRestituerWindow } from '@pages/AssuranceWindows'
import { ClefAdminWindow, FixerRefWindow, PosteImmatWindow } from '@pages/OutilsSimpleWindows'
import {
  TypesVehiculeWindow, ParamDestinationsWindow,
  ConfigAssurancesWindow, ConfigImprimantesWindow,
} from '@pages/OutilsConfigWindows'
import UserManagementWindow from '@pages/UserManagementWindow'

export function renderWindowContent(id: string): JSX.Element {
  switch (id) {
    // ── Fenêtres principales (sidebar) ────────────────────────────
    case 'enregistrement':
      return <EnregistrementPage />
    case 'destination':
      return <DestinationPage />
    case 'listeVehicules':
      return <ListePage />
    case 'rechercheImmat':
      return <RechercheWindow mode="immat" />
    case 'rechercheChassis':
      return <RechercheWindow mode="chassis" />

    // ── Menu Fichier ───────────────────────────────────────────────
    case 'fichier.marques':
      return <FichierMarquesPage />

    // ── Menu Enregistrements ───────────────────────────────────────
    case 'enregistrements.listeChassis':
      return <ListePage />
    case 'enregistrements.listeParDest':
      return <ListeParDestPage />
    case 'enregistrements.opsParticulieres':
      return <OpsParticulieresPage />

    // ── Menu Analyse ───────────────────────────────────────────────
    case 'analyse':
    case 'analyse.stca':
      return <AnalysePage />
    case 'analyse.assurance':
      return <AnalyseAssuranceWindow />

    // ── Menu Assurances ────────────────────────────────────────────
    case 'assurances.montantRestituer':
      return <MontantRestituerWindow />

    // ── Menu Outils ───────────────────────────────────────────────
    case 'outils.gestionUtilisateurs':
      return <UserManagementWindow />
    case 'outils.clefAdmin':
      return <ClefAdminWindow />
    case 'outils.archivage':
      return <ArchivagePage />
    case 'outils.fixerRef':
      return <FixerRefWindow />
    case 'outils.posteImmat':
      return <PosteImmatWindow />
    case 'outils.configAssurances':
      return <ConfigAssurancesWindow />
    case 'outils.typesVehicule':
      return <TypesVehiculeWindow />
    case 'outils.paramDestinations':
      return <ParamDestinationsWindow />
    case 'outils.configImprimantes':
      return <ConfigImprimantesWindow />
    case 'outils.exporter':
      return <ExportPage />
    case 'outils.pointage':
      return <PointagePage />

    // ── Menu Aide ─────────────────────────────────────────────────
    case 'aide.copyright':
      return <CopyrightWindow />
    case 'aide.version':
      return <VersionWindow />
    case 'aide.idReseau':
      return <IdReseauWindow />

    default:
      return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#aaa', fontSize: 13 }}>
          {id} — fenêtre non configurée
        </div>
      )
  }
}
