import EnregistrementPage from '@pages/EnregistrementPage'
import DestinationPage from '@pages/DestinationPage'
import ListePage from '@pages/ListePage'
import ListeParDestPage from '@pages/ListeParDestPage'
import ListePrintPreview from '@pages/ListePrintPreview'
import ListeParDestPrintPreview from '@pages/ListeParDestPrintPreview'
import DestinationPrintPreview from '@pages/DestinationPrintPreview'
import CarteGriseApercuWindow from '@pages/CarteGriseApercuWindow'
import AnalysePrintPreview from '@pages/AnalysePrintPreview'
import MontantRestituerPrintPreview from '@pages/MontantRestituerPrintPreview'
import FactureApercuWindow from '@pages/FactureApercuWindow'
import FicheIdApercuWindow from '@pages/FicheIdApercuWindow'
import Feuillet3ApercuWindow from '@pages/Feuillet3ApercuWindow'
import Feuillet1ApercuWindow from '@pages/Feuillet1ApercuWindow'
import Feuillet2ApercuWindow from '@pages/Feuillet2ApercuWindow'
import OpsParticulieresPage from '@pages/OpsParticulieresPage'
import RechercheWindow from '@pages/RechercheWindow'
import { CopyrightWindow, VersionWindow, IdReseauWindow } from '@pages/InfoWindows'
import FichierMarquesPage from '@pages/FichierMarquesPage'
import ArchivagePage from '@pages/ArchivagePage'
import PointagePage from '@pages/PointagePage'
import ExportPage from '@pages/ExportPage'
import { AnalyseAssuranceWindow, MontantRestituerWindow } from '@pages/AssuranceWindows'
import { FixerRefWindow, PosteImmatWindow } from '@pages/OutilsSimpleWindows'
import {
  TypesVehiculeWindow, ParamDestinationsWindow,
} from '@pages/OutilsConfigWindows'
import ConfigImprimantesWindow from '@pages/ConfigImprimantesWindow'
import ConfigAssurancesWindow from '@pages/ConfigAssurancesWindow'
import ListeAssurancesApercuWindow from '@pages/ListeAssurancesApercuWindow'
import EditionAssureurWindow from '@pages/EditionAssureurWindow'
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

    // ── Aperçus avant impression (BrowserWindows libres — Règle 10) ──
    case 'apercu.listeVehicules':
      return <ListePrintPreview />
    case 'apercu.listeParDest':
      return <ListeParDestPrintPreview />
    case 'apercu.destination':
      return <DestinationPrintPreview />
    case 'apercu.carteGrise':
      return <CarteGriseApercuWindow />
    case 'apercu.analyse':
      return <AnalysePrintPreview />
    case 'apercu.montantRestituer':
      return <MontantRestituerPrintPreview />
    case 'apercu.facture':
      return <FactureApercuWindow />
    case 'apercu.ficheId':
      return <FicheIdApercuWindow />
    case 'apercu.feuillet3':
      return <Feuillet3ApercuWindow />
    case 'apercu.feuillet1':
      return <Feuillet1ApercuWindow />
    case 'apercu.feuillet2':
      return <Feuillet2ApercuWindow />
    case 'apercu.listeAssurances':
      return <ListeAssurancesApercuWindow />
    case 'edition.assureur':
      return <EditionAssureurWindow />

    // ── Menu Analyse — géré comme overlay modal dans MainScreen, pas en MDI
    // case 'analyse': / case 'analyse.stca': → MainScreen.tsx
    case 'analyse.assurance':
      return <AnalyseAssuranceWindow />

    // ── Menu Assurances — géré comme overlay modal dans MainScreen
    // case 'assurances.montantRestituer': → MainScreen.tsx

    // ── Menu Outils ───────────────────────────────────────────────
    case 'outils.gestionUtilisateurs':
      return <UserManagementWindow />
    // case 'outils.clefAdmin' → overlay ClefAdminFlow dans MainScreen (Règle 17)
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
