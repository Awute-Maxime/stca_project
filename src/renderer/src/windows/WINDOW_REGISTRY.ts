import type { WindowConfig } from '@store/windowStore'

// Les coordonnées x, y sont en pixels viewport (position: fixed).
// La sidebar fait 100px, la barre de menus 64px.
// Les fenêtres s'ouvrent légèrement décalées pour éviter l'empilement exact.

export const WINDOW_REGISTRY: Record<string, WindowConfig> = {
  // ── Fenêtres principales (sidebar) ────────────────────────────
  enregistrement:           { title: 'Enregistrement des véhicules',                       defaultX: 160, defaultY:  94, width: 980, height: 640 },
  destination:              { title: 'Nombre Véhicules par Frontières',                    defaultX: 180, defaultY: 114, width: 900, height: 640 },
  analyse:                  { title: 'Edition des rapports d\'analyse',                    defaultX: 200, defaultY: 124, width: 820, height: 580 },
  listeVehicules:           { title: 'Liste des Véhicules Enregistrés',                    defaultX: 180, defaultY: 114, width: 940, height: 660 },
  rechercheImmat:           { title: 'Recherche par N° Immatriculation',                   defaultX: 220, defaultY: 144, width: 720, height: 540 },
  rechercheChassis:         { title: 'Recherche par N° Chassis (VIN)',                     defaultX: 240, defaultY: 154, width: 720, height: 540 },

  // ── Menu Fichier ───────────────────────────────────────────────
  'fichier.marques':                { title: 'Liste des Marques / Modèles de véhicules',        defaultX: 240, defaultY: 134, width: 800, height: 620 },

  // ── Menu Enregistrements ───────────────────────────────────────
  'enregistrements.listeChassis':       { title: 'Liste Véhicules Enregistrés par N°Chassis (VIN)', defaultX: 200, defaultY: 124, width: 940, height: 660 },
  'enregistrements.listeParDest':       { title: 'Liste des véhicules enregistrés par destination',  defaultX: 180, defaultY: 114, width: 940, height: 660 },
  'enregistrements.opsParticulieres':   { title: 'Liste des Opérations Particulières',               defaultX: 200, defaultY: 134, width: 940, height: 660 },

  // ── Menu Analyse ───────────────────────────────────────────────
  'analyse.stca':                   { title: 'Edition des rapports d\'analyse — TCIT',           defaultX: 200, defaultY: 124, width: 820, height: 580 },
  'analyse.assurance':              { title: 'Gain généré par les assurances',                   defaultX: 200, defaultY: 124, width: 980, height: 660 },

  // ── Menu Assurances ────────────────────────────────────────────
  'assurances.montantRestituer':    { title: 'Montant à restituer',                              defaultX: 200, defaultY: 124, width: 980, height: 660 },

  // ── Menu Outils ───────────────────────────────────────────────
  'outils.gestionUtilisateurs':      { title: 'Gestion des utilisateurs',                          defaultX: 260, defaultY: 154, width: 720, height: 520 },
  'outils.clefAdmin':               { title: 'Clef d\'administration',                           defaultX: 260, defaultY: 154, width: 640, height: 480 },
  'outils.archivage':               { title: 'Archivage des enregistrements',                    defaultX: 130, defaultY: 100, width: 1180, height: 690 },
  'outils.fixerRef':                { title: 'Fixer N° Référence',                               defaultX: 340, defaultY: 204, width: 580, height: 340 },
  'outils.posteImmat':              { title: 'Activation du mode assurance',                     defaultX: 260, defaultY: 154, width: 640, height: 480 },
  'outils.configAssurances':        { title: "Liste d'assureur ou Groupement d'assurance",       defaultX: 200, defaultY: 120, width: 950, height: 475 },
  'outils.typesVehicule':           { title: 'Types Véhicule',                                   defaultX: 320, defaultY: 184, width: 540, height: 460 },
  'outils.paramDestinations':       { title: 'Paramètres Destinations',                          defaultX: 240, defaultY: 144, width: 800, height: 600 },
  'outils.configImprimantes':       { title: 'Configuration des éditions et imprimantes',        defaultX: 220, defaultY: 110, width: 820, height: 700 },
  'outils.exporter':                { title: 'Exportation des enregistrements de véhicules',     defaultX: 260, defaultY: 154, width: 680, height: 420 },
  'outils.pointage':                { title: 'Pointage / Dépointage de la sortie des véhicules', defaultX: 200, defaultY: 124, width: 980, height: 660 },

  // ── Aperçus avant impression (BrowserWindows libres — Règle 10) ──
  'apercu.listeVehicules':          { title: 'Aperçu avant impression — Liste des Véhicules',    defaultX: 140, defaultY:  60, width: 900, height: 720 },
  'apercu.listeParDest':            { title: 'Liste des Véhicules par destination',              defaultX: 200, defaultY:  50, width: 700, height: 760 },
  'apercu.destination':             { title: 'Liste des Véhicules par destination',              defaultX: 180, defaultY:  50, width: 860, height: 740 },
  'apercu.carteGrise':              { title: 'Aperçu — Carte Grise (fiche pré-imprimée 10,5 × 21,2 cm)', defaultX: 240, defaultY: 30, width: 560, height: 900 },
  'apercu.analyse':                 { title: 'Aperçu avant impression — Rapport d\'analyse',     defaultX: 180, defaultY:  50, width: 860, height: 740 },
  'apercu.montantRestituer':        { title: 'Montant à restituer',                              defaultX: 160, defaultY:  50, width: 960, height: 740 },
  'apercu.facture':                 { title: 'Aperçu — Facture (A4)',                            defaultX: 200, defaultY:  30, width: 880, height: 900 },
  'apercu.listeAssurances':         { title: 'Liste des Assurances gérés dans TCIT',             defaultX: 240, defaultY:  30, width: 880, height: 860 },
  'apercu.ficheId':                 { title: 'Aperçu — Fiche ID (papier jaune 10,5 × 21,2 cm)',  defaultX: 260, defaultY:  30, width: 560, height: 900 },
  'apercu.feuillet3':               { title: 'Aperçu — Feuillet N°3 Cond. Part. (pré-imprimé A4)', defaultX: 200, defaultY: 30, width: 880, height: 900 },
  'apercu.feuillet1':               { title: 'Aperçu — Feuillet N°1 Assurance Bleu (28,2 × 7,51 cm)', defaultX: 60, defaultY: 120, width: 1180, height: 480 },
  'apercu.feuillet2':               { title: 'Aperçu — Feuillet N°2 Assurance Rose (28,2 × 7,51 cm)', defaultX: 60, defaultY: 150, width: 1180, height: 480 },

  // ── Menu Aide ─────────────────────────────────────────────────
  'aide.copyright':                 { title: 'Copyright',  defaultX: 400, defaultY: 244, width: 500, height: 280 },
  'aide.version':                   { title: 'Version',    defaultX: 420, defaultY: 254, width: 500, height: 340 },
  'aide.idReseau':                  { title: 'ID réseau',  defaultX: 440, defaultY: 264, width: 500, height: 360 },
}
