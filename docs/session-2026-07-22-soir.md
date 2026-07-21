# Session du 22 juillet 2026 (soirée) — Fixer N° Référence + analyse migration

Suite de la session Types Véhicule / Paramètres Destinations (commit 539c0a7).

## 1. Fixer N° Référence — FAIT et testé (⏳ en attente de validation utilisateur)

L'utilisateur ne savait pas à quoi servait ce menu ; proposition d'options faite,
il a retenu le **garde-fou automatique** (+ le socle qu'il exige), puis le
bouton **↺ Réaligner**.

### Le socle : un vrai compteur persisté (`vehiculesStore`)
Avant, `nextRef()` recalculait `max(ref) + 1` à la volée — il n'y avait rien à
« fixer ». Désormais :
- `tcit_ref_compteur` = « N° de référence en cours », initialisé depuis la base.
- `maxRefActifs()` / `maxRefArchives()` / **`maxRefEnBase()`** (actifs **ET**
  archivés — une référence archivée reste prise).
- `addVehicule()` fait avancer le compteur sur la référence réellement attribuée.
- `nextRef()` est **DÉFENSIF** : `max(compteur, maxRefEnBase) + 1`. Même avec un
  compteur faussé, impossible de produire un doublon.

> ⚠️ Lecture directe de `localStorage['tcit_archives']` dans `vehiculesStore` :
> volontaire. `archivesStore` importe déjà `vehiculesStore` — l'importer en
> retour créerait un cycle.

### Le garde-fou (fenêtre refaite, `OutilsSimpleWindows.tsx`)
Le vrai STCA affiche « Attention ! Contrôler la table DB 'enregistrement' avant
de modifier ce N° ! ». **TCIT fait ce contrôle lui-même**, en direct :

| Saisie | Verdict |
|---|---|
| < max utilisé | 🔴 **Refusé** — « N référence(s) seraient ré-attribuées » + liste + minimum autorisé. Valider désactivé. |
| = max utilisé | 🟢 Aligné, aucun risque de doublon |
| > max utilisé | 🟡 « Saut de N numéros » — autorisé, précise ceux qui resteront inutilisés |

Plus : bouton **↺ Réaligner** (cale sur `maxRefEnBase`, se désactive si déjà
aligné) et un **bandeau d'anomalie** quand le compteur stocké est en retard sur
la base — typique après restauration. Garde admin `outils.fixerRef`.
Fenêtre 600×660.

### Bug réel attrapé pendant le test
À la première ouverture, le garde-fou a signalé compteur `010058` vs max réel
`010063`. Cause : **mon initialisation ignorait les archives** (5 archivés
portaient les réfs les plus hautes) → le prochain enregistrement aurait reçu
`010059`, doublon d'un archivé. Corrigé (`maxRefEnBase`) et vérifié : compteur
volontairement faussé à `10000` ⇒ `nextRef()` retourne quand même `010064`.

## 2. Config. Poste N° IMMAT. — REPORTÉE par l'utilisateur
Capture reçue (case « Activer le mode de fonctionnement avec Assurance » +
Coordonnées du PC Affichage IMMAT : IP `192.168.0.25`, port `8000`, bouton
Tester). **Rien codé** : l'utilisateur doit d'abord vérifier ce que fait
exactement la case. Question en suspens : est-ce le même interrupteur que la
« mise en service » de Config. Assurances, ou un réglage par poste ?
Note : `PosteImmatWindow` est encore un stub inventé (2 modes radio) qui ne
correspond pas à la capture — à refaire. Aucun socket n'existe dans `src/main`.

## 3. Exporter → sauvegarde/restauration : ANALYSE, décision en attente

L'utilisateur veut un **vrai outil de sauvegarde ET de restauration**, et — point
capital ajouté ensuite — **pouvoir intégrer l'ancienne base STCA**.

### Inventaire des données (3 catégories)
- 🔴 **Métier** : `tcit_vehicules_added/updated/removed`, `tcit_archives`,
  `tcit_ref_compteur`.
- 🟠 **Configuration** : utilisateurs, marques, destinations (+ couleurs),
  types véhicule, assurances, impression, mdp forçage.
- ⚪ **Éphémère — à NE PAS sauvegarder** : `tcit_session_login`,
  `tcit_edition_*`, `tcit_apercu_*`, `tcit_*_printed`.

### Le mur : 338 075 enregistrements vs localStorage
La base **STCA M** (HFSQL C/S, `DESKTOP-70HQGN:4900`) contient **338 075**
enregistrements ≈ **100 Mo**. Le localStorage plafonne à **~5 Mo** — 15 à 20×
au-dessus. **Importer l'ancienne base impose d'abandonner le localStorage pour
une vraie base de données.** Ce n'est pas contournable.

### Bonne nouvelle : notre modèle colle déjà
`CATVEH` (RANG + TypeVehicule) → `typesVehiculeStore` {rang, nom} — le « Rang
dans la combos » EST le champ `RANG`. `ZoneImportation` → `destinationsStore`.
`TYPEASSURANCE` → assureurs. `VEHASSURANCE` (TarifBrut/Taxe/ComStca/**ARestituer**)
→ nos tarifs. `TYPEVEH` → `marquesStore`. `REFENREG` (NumRef) → notre compteur.
`ARCHIVE` (+ DateArchivage) → `archivesStore`. Migration quasi 1:1.

Manquent chez nous : `AncienneImmatriculation`, `DateAncienneCG`.
À retenir : l'index `NumImmatriculation + CodeTransit` est **UNIQUE** (c'est le
couple, pas la plaque seule).

### Décision proposée à l'utilisateur (en attente)
- **Option A — SQLite local** (recommandé pour démarrer) : un fichier, zéro
  serveur, 338k lignes sans souci, sauvegarde = copie de fichier.
- **Option B — PostgreSQL serveur** : fidèle au client/serveur actuel
  (table `CONNEXION` = postes connectés), plus lourd à déployer.
- Prisma permet de basculer A → B sans réécrire l'app.

⚠️ `prisma/schema.prisma` date du 06/06, **avant** l'exploration de la vraie base
(15/06) : champs inventés (`couleur`, `annee`, `dateExpiration`) — **à refaire**
d'après le schéma réel.

### Ordre recommandé
1. Base de données (SQLite + schéma fidèle STCA)
2. Assistant d'importation de l'ancienne base (CSV export STCA ou ODBC HFSQL ;
   correspondance des colonnes, aperçu, import par lots, rapport d'erreurs)
3. Sauvegarde / restauration — devient triviale une fois la base en place

Extraction HFSQL : export CSV depuis STCA (le plus simple) ou driver ODBC PC
SOFT. Lire les `.FIC` directement = propriétaire, à éviter.

## Prochaine session
L'utilisateur relit cette analyse et **décide** : attaquer la base de données +
import, ou finir d'abord les fenêtres restantes (Exporter, Pointage) et garder
le chantier base pour un moment dédié.
