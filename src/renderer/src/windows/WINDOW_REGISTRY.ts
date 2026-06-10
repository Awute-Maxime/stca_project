import type { WindowConfig } from '@store/windowStore'

// Les coordonnées x, y sont en pixels viewport (position: fixed).
// La sidebar fait 100px, la barre de menus 64px.
// Les fenêtres s'ouvrent légèrement décalées pour éviter l'empilement exact.

export const WINDOW_REGISTRY: Record<string, WindowConfig> = {
  // ── Fenêtres principales (sidebar) ────────────────────────────
  enregistrement:           { title: 'Enregistrement des véhicules',                      defaultX: 160, defaultY:  94, width: 820, height: 600 },
  destination:              { title: 'Nombre Véhicules par Frontières',                   defaultX: 180, defaultY: 114, width: 720, height: 500 },
  analyse:                  { title: 'Edition des rapports d\'analyse',                   defaultX: 200, defaultY: 124, width: 620, height: 460 },
  listeVehicules:           { title: 'Liste des Véhicules Enregistrés',                   defaultX: 180, defaultY: 114, width: 760, height: 520 },
  rechercheImmat:           { title: 'Recherche par N° Immatriculation',                  defaultX: 220, defaultY: 144, width: 560, height: 420 },
  rechercheChassis:         { title: 'Recherche par N° Chassis (VIN)',                    defaultX: 240, defaultY: 154, width: 560, height: 420 },

  // ── Menu Fichier ───────────────────────────────────────────────
  'fichier.marques':                { title: 'Liste des Marques / Modèles de véhicules',       defaultX: 240, defaultY: 134, width: 640, height: 500 },

  // ── Menu Enregistrements ───────────────────────────────────────
  'enregistrements.listeChassis':   { title: 'Liste Véhicules Enregistrés par N°Chassis (VIN)', defaultX: 200, defaultY: 124, width: 760, height: 520 },

  // ── Menu Analyse ───────────────────────────────────────────────
  'analyse.stca':                   { title: 'Edition des rapports d\'analyse — STCA',          defaultX: 200, defaultY: 124, width: 640, height: 460 },
  'analyse.assurance':              { title: 'Gain généré par les assurances',                  defaultX: 200, defaultY: 124, width: 820, height: 540 },

  // ── Menu Assurances ────────────────────────────────────────────
  'assurances.montantRestituer':    { title: 'Montant à restituer',                             defaultX: 200, defaultY: 124, width: 820, height: 540 },

  // ── Menu Outils ───────────────────────────────────────────────
  'outils.clefAdmin':               { title: 'Clef d\'administration',                          defaultX: 260, defaultY: 154, width: 500, height: 380 },
  'outils.archivage':               { title: 'Enregistrements archivés',                        defaultX: 200, defaultY: 124, width: 820, height: 540 },
  'outils.fixerRef':                { title: 'Fixer N° Référence',                              defaultX: 340, defaultY: 204, width: 460, height: 260 },
  'outils.posteImmat':              { title: 'Activation du mode assurance',                    defaultX: 260, defaultY: 154, width: 500, height: 380 },
  'outils.configAssurances':        { title: 'Configuration Assurances',                        defaultX: 240, defaultY: 144, width: 580, height: 420 },
  'outils.typesVehicule':           { title: 'Types Véhicule',                                  defaultX: 320, defaultY: 184, width: 420, height: 360 },
  'outils.paramDestinations':       { title: 'Paramètres Destinations',                         defaultX: 240, defaultY: 144, width: 640, height: 480 },
  'outils.configImprimantes':       { title: 'Configuration des éditions et imprimantes',       defaultX: 220, defaultY: 134, width: 680, height: 520 },
  'outils.exporter':                { title: 'Exportation des enregistrements de véhicules',    defaultX: 260, defaultY: 154, width: 540, height: 320 },
  'outils.pointage':                { title: 'Pointage / Dépointage de la sortie des véhicules',defaultX: 200, defaultY: 124, width: 820, height: 540 },

  // ── Menu Aide ─────────────────────────────────────────────────
  'aide.copyright':                 { title: 'Copyright',  defaultX: 400, defaultY: 244, width: 420, height: 220 },
  'aide.version':                   { title: 'Version',    defaultX: 420, defaultY: 254, width: 420, height: 280 },
  'aide.idReseau':                  { title: 'ID réseau',  defaultX: 440, defaultY: 264, width: 420, height: 300 },
}
