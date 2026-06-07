# Refonte Phase 3 — UI fidèle à STCA II

**Date :** 2026-06-07
**Statut :** Validé par l'utilisateur — prêt pour planification

## Contexte

La première version de la Phase 3 (UI) s'est éloignée de l'objectif réel : au lieu d'une
**copie fidèle** de STCA II (app WinDev/HFSQL existante), elle a produit une interprétation
"moderne et animée" (fond sombre, dégradés dorés, style non WinDev). En comparant le code
existant aux ~250 captures de `docs/screenshots/`, l'écart est net : le vrai login est une
petite boîte blanche/grise sobre avec cadenas gris, le vrai formulaire d'enregistrement est
une fenêtre interne vert olive/blanc cassé classique Windows, et la roue de navigation
centrale (6 icônes + bouton power rouge) est totalement absente de la version actuelle.

**Objectif de cette refonte :**
1. Reconstruire l'UI en copie fidèle de STCA II (couleurs, dispositions, structure de menus,
   architecture MDI, roue de navigation)
2. Repartir de zéro sur le code des pages — la structure actuelle ne reflète pas l'original
3. Consigner séparément les idées d'amélioration repérées en chemin (ne pas les implémenter
   maintenant)

## Périmètre

### Dans le périmètre
- Écran de connexion fidèle (boîte simple blanche/grise, cadenas gris, PAS de fond sombre/or)
- Écran principal avec roue de navigation (6 icônes autour du bouton power rouge central)
- Architecture MDI fidèle (chrome de fenêtre vert olive, boutons Windows réduire/agrandir/fermer)
- Barre de menus complète : Fichier / Enregistrements des véhicules / Analyse / Assurances /
  Outils+Config. / ?
- Toutes les fenêtres internes listées dans l'inventaire ci-dessous
- Données mock fidèles aux exemples documentés dans l'exploration Phase 2

### Hors périmètre (reporté)
- Connexion au vrai backend Express+Prisma+PostgreSQL (déjà planifiée séparément)
- Améliorations UX vs. original — consignées dans `docs/ameliorations-futures.md`, traitées
  dans une phase ultérieure dédiée
- Fonctions matérielles réelles (scanner code-barres USB, impression réseau) — simulées dans l'UI

## Approche technique : Hybride Ant Design re-thémé + composants sur-mesure

- **Thème Ant Design strict** (`theme/windev-theme.ts`) : tokens définissant les couleurs
  exactes extraites des captures (gris fond `#C8CAC8`/`#D4D4D0`, vert olive menus
  `#4A7030→#2D4D1A`, rouge/vert boutons), police système (Tahoma/Segoe UI) en 12-13px,
  rayons de bordure à 0-2px (style Windows classique, pas arrondi moderne)
- **Composants sur-mesure** pour les éléments propres à STCA II : `NavigationWheel`,
  `MenuBar`, `MdiWindow` (refonte de `FloatingWindow`), `StatusBar`
- **Composants Ant Design re-thémés** pour la logique complexe : `Table`, `Form`, `Input`,
  `Select`, `DatePicker`, `Modal` — le thème global garantit l'apparence WinDev

### Organisation des dossiers (`src/renderer/src/`)
```
theme/windev-theme.ts        ← thème Ant Design global
components/
  ├── shell/                 ← MenuBar, StatusBar, MdiWindow, NavigationWheel
  └── ...                    ← modales référentiels réutilisables
windows/                     ← une fenêtre interne = un composant (remplace pages/)
  ├── EnregistrementWindow.tsx
  ├── ListeVehiculesWindow.tsx
  ├── RechercheImmatWindow.tsx
  ├── GestionUtilisateursWindow.tsx
  └── ...
mock/                        ← données factices fidèles aux exemples documentés
```

## Inventaire des fenêtres à construire

**Connexion**
- Login (boîte simple) + bouton conditionnel "Gestion des utilisateurs" + dialogue
  "Modification d'un mot de passe"

**Roue de navigation (écran principal)**
| Item | Fenêtre cible |
|------|---------------|
| Enregistrement | Formulaire d'enregistrement complet |
| Destination | "Nombre Véhicules par Frontières" |
| Analyse | Dialogue secteur (STCA / Assurance) → rapports |
| Liste Véhicules | "Nombre Véhicules par Frontières" (= Destination) |
| Recherche IMMAT. | Champ + scanner code-barres simulé + bouton Impr. |
| Recherche N°Chassis | Identique à Recherche IMMAT (scanner VIN) |

**Menu Fichier**
- Marques et modèles de véhicules (CRUD liste : Nouveau/Modifier/Supprimer/Imprimer/Quitter)
- Fermer la session / Quitter

**Menu Enregistrements des véhicules**
- Liste véhicules par N°Chassis (VIN)

**Menu Analyse**
- Secteur STCA → Edition rapports (Rapports détaillés / résumés / annuel)
- Secteur Assurance → "Gain généré par les assurances"

**Menu Assurances**
- "Montant à restituer"

**Menu Outils+Config.** (12 sous-fenêtres, dont 2 désactivées comme dans l'original)
- Sauvegarde BD *(grisé/désactivé, fidèle à l'original)*
- Clef d'administration
- Archivage
- Fixer N° Référence
- *Impression de plaque d'immatriculation* (grisé/cliquable sans action, fidèle à l'original)
- Config. Poste N° IMMAT.
- Configuration Assurances
- Types Véhicule
- Paramètres Destinations
- Config. Imprimantes
- Exporter les enregistrements de véhicules
- Pointage des véhicules

**Menu ?**
- Copyright, Version, ID réseau

**Modales référentiels** (ouvertes via boutons "?")
- Liste des parcs (ZoneImportation), Maisons de transit, Sélection Marque-Modèle

## Données mock & validation visuelle

**Données mock fidèles** (`mock/`) reconstruites à partir des exemples documentés :
- 10 destinations réelles (codes, tarifs 10 000 FCFA, lettres, n° immat actuels)
- Types véhicules (Voiture/Camion/Autre)
- Échantillon représentatif de marques/modèles (pas 20 000 entrées — un set réaliste pour
  tester scroll/recherche)
- Véhicules basés sur les exemples réels (ABDULLAHI BABA/CK/FIAT, etc.)
- 18 utilisateurs avec statuts Administrateur/Compte actif documentés
- Échantillons Zones d'importation / Maisons de transit

**Process de validation visuelle**, par fenêtre :
1. Construire le composant à partir de la/les capture(s) de référence correspondante(s)
2. Lancer l'app, ouvrir la fenêtre, capturer
3. Comparer côte à côte avec l'original → ajuster jusqu'à fidélité satisfaisante
4. Marquer la fenêtre comme validée dans le suivi de progression

## Animations

Fidélité stricte d'abord : reproduire l'apparence statique exacte (couleurs, polices,
bordures, dispositions). Animations limitées à des transitions discrètes qui n'altèrent pas
l'apparence statique (ex. ouverture/fermeture douce des fenêtres MDI — l'original en a déjà
un peu). Pas de fioritures visuelles ajoutées par rapport à l'original.

## Suivi des améliorations

Toute idée d'amélioration repérée pendant la reconstruction est consignée dans
`docs/ameliorations-futures.md` (contexte + idée), sans implémentation immédiate — à traiter
dans une phase ultérieure dédiée, après validation complète de la fidélité.

## Captures de référence

~250 captures déjà disponibles dans `docs/screenshots/` — jugées suffisantes pour couvrir
l'ensemble de l'inventaire. L'application originale STCA II reste opérationnelle sur la
machine si des captures ciblées supplémentaires s'avèrent nécessaires en cours de route.
