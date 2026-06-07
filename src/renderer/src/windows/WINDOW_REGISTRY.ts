import type { WindowConfig } from '@store/windowStore'

export const WINDOW_REGISTRY: Record<string, WindowConfig> = {
  enregistrement:        { title: 'Enregistrement des véhicules',                 defaultX: 60,  defaultY: 30, width: 760, height: 540 },
  destination:           { title: 'Nombre Véhicules par Frontières',              defaultX: 80,  defaultY: 50, width: 680, height: 460 },
  analyse:               { title: 'Edition des rapports d\'analyse',              defaultX: 100, defaultY: 60, width: 560, height: 380 },
  listeVehicules:        { title: 'Nombre Véhicules par Frontières',              defaultX: 80,  defaultY: 50, width: 680, height: 460 },
  rechercheImmat:        { title: 'Recherche par N° Immatriculation',             defaultX: 120, defaultY: 80, width: 480, height: 320 },
  rechercheChassis:      { title: 'Recherche par N° Chassis',                     defaultX: 120, defaultY: 80, width: 480, height: 320 },
  'fichier.marques':           { title: 'Liste des Marques / Modèles de véhicules',     defaultX: 140, defaultY: 70,  width: 580, height: 430 },
  'enregistrements.listeChassis': { title: 'Liste Véhicules Enregistrés par N°Chassis (VIN)', defaultX: 100, defaultY: 60, width: 680, height: 460 },
  'analyse.stca':              { title: 'Edition des rapports d\'analyse — STCA',        defaultX: 100, defaultY: 60,  width: 560, height: 380 },
  'analyse.assurance':         { title: 'Gain généré par les assurances',               defaultX: 100, defaultY: 60,  width: 760, height: 480 },
  'assurances.montantRestituer': { title: 'Montant à restituer',                        defaultX: 100, defaultY: 60,  width: 760, height: 480 },
  'outils.clefAdmin':          { title: 'Clef d\'administration',                       defaultX: 160, defaultY: 90,  width: 460, height: 320 },
  'outils.archivage':          { title: 'Enregistrements archivés',                     defaultX: 100, defaultY: 60,  width: 760, height: 480 },
  'outils.fixerRef':           { title: 'Fixer N° Référence',                           defaultX: 200, defaultY: 120, width: 420, height: 220 },
  'outils.posteImmat':         { title: 'Activation du mode assurance',                 defaultX: 160, defaultY: 90,  width: 460, height: 320 },
  'outils.configAssurances':   { title: 'Configuration Assurances',                     defaultX: 140, defaultY: 80,  width: 520, height: 360 },
  'outils.typesVehicule':      { title: 'Types Véhicule',                               defaultX: 200, defaultY: 120, width: 380, height: 320 },
  'outils.paramDestinations':  { title: 'Paramètres Destinations',                      defaultX: 140, defaultY: 80,  width: 580, height: 420 },
  'outils.configImprimantes':  { title: 'Configuration des éditions et imprimantes',    defaultX: 120, defaultY: 70,  width: 620, height: 460 },
  'outils.exporter':           { title: 'Exportation des enregistrements de véhicules', defaultX: 160, defaultY: 90,  width: 480, height: 280 },
  'outils.pointage':           { title: 'Pointage / Dépointage de la sortie des véhicules', defaultX: 100, defaultY: 60, width: 760, height: 480 },
  'aide.copyright':            { title: 'Copyright',   defaultX: 260, defaultY: 160, width: 360, height: 180 },
  'aide.version':              { title: 'Version',     defaultX: 260, defaultY: 160, width: 360, height: 220 },
  'aide.idReseau':             { title: 'ID réseau',   defaultX: 260, defaultY: 160, width: 360, height: 240 }
}
