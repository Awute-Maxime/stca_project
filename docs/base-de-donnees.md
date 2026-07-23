# Base de données TCIT — Conception (Phase 1)

Document de référence de la migration du localStorage vers une vraie base de
données, fidèle à l'ancienne base HFSQL **STCA M** (338 075 enregistrements).

## Pourquoi

Le localStorage du navigateur est plafonné à **~5 Mo**. Les 338 075
enregistrements de STCA M pèsent ~100 Mo → impossible à contenir. Importer
l'ancienne base **impose** une vraie base de données.

## Architecture (validée le 22/07/2026)

- **Prisma 6** (ORM) + **SQLite** au démarrage : un simple fichier local
  (`prisma/stca.db`), zéro serveur à installer.
- Le but final reste le **client/serveur multi-poste**. Le passage à
  **PostgreSQL** (Phase 4) se fera en changeant le `provider` du datasource —
  les modèles et le code Prisma restent identiques.
- Prisma tourne dans le **process principal d'Electron** ; le renderer y accède
  par IPC (Phase 3). Extraction vers le dossier `server/` en Phase 4.

## Décisions de modélisation (validées)

1. **Archives = une seule table.** STCA sépare `ENREGISTREMENTS` et `ARCHIVE` ;
   ici une seule table `enregistrement` avec `dateArchivage` (nul = actif,
   rempli = archivé). Colle au concept « l'archivage ne sort rien du système ».
   Les 2 tables STCA fusionnent à l'import.
2. **Mots de passe en clair pour l'instant** (comme aujourd'hui) — hachage
   branché en Phase 3 (bascule du login).
3. **Portée = tout STCA M**, même les champs pas encore affichés
   (`AncienneImmatriculation`, `DateAncienneCG`, `Pays`…), pour un import sans
   perte.

## Correspondance STCA M → schéma TCIT

| Table STCA M (HFSQL) | Modèle Prisma | Notes |
|---|---|---|
| `CATVEH` (RANG, TypeVehicule) | `CategorieVehicule` (rang, nom) | le « Rang dans la combos » = RANG |
| `ZoneImportation` | `Destination` | + `couleur` de plaque (ajout TCIT) |
| `TYPEVEH` / `TypVehIndex` | `MarqueModele` | marque, modèle, libellé |
| `PAYS` | `Pays` | nom, ISO3, actif, continent… |
| `TYPEASSURANCE` | `Assureur` | nom, coordonnées |
| `VEHASSURANCE` | `TarifAssurance` | + détail primes RC/CEDEAO/Individuelle/Accessoires (ajout TCIT) |
| `ENREGISTREMENTS` + `ARCHIVE` | `Enregistrement` | **fusionnées** (dateArchivage) |
| (comptes) | `Utilisateur` | login, mdp, administrateur, compteActif |
| `REFENREG`, réglages | `Parametre` (clé/valeur) | compteur réf, mise en service, mdp forçage |

### Points fidèles à STCA importants
- **Contrainte unique = le COUPLE** `(numImmatriculation, codeTransit)`
  (index `Compo_ImmaCode`), pas la plaque seule. Vérifié en test.
- `vin` (Vin_Vehicule / châssis) = unique.
- `numRef` (NumRef) = unique.
- `categorieRang` et `codeTransit` de l'`Enregistrement` = **références souples**
  (valeurs indexées, pas de contrainte dure) → import robuste de données
  héritées, comme les clés « avec doublon » de STCA.
- Montants en **entiers** (F CFA, sans centimes).

### Écarts assumés vs STCA M
- `couleur` (Destination) et le détail des primes (TarifAssurance) sont des
  **ajouts TCIT** — absents de STCA, donc dérivés/par défaut à l'import.
- Champs STCA techniques non repris pour l'instant : `CLEF`, `CONNEXION`
  (licences / postes) → utiles en Phase 4 (multi-poste).

## État Phase 1 (FAIT)

- `prisma/schema.prisma` : 9 modèles, fidèle à STCA M. Validé.
- Migration initiale `20260723201113_init_stca_m` → 9 tables créées.
- Base vide `prisma/stca.db` (ignorée par git).
- Client Prisma généré. Test end-to-end OK (écriture, lecture, refus de doublon
  immat+frontière, nettoyage).
- **Aucune bascule de l'app** : elle tourne toujours sur localStorage.

## Suite

- **Phase 2 — Assistant d'import** : lire un export de l'ancienne base
  (CSV depuis STCA, ou ODBC HFSQL) → mapping des colonnes → aperçu → import par
  lots → rapport (importés / ignorés / doublons / erreurs). Recalage du compteur
  de référence à la fin.
- **Phase 3 — Bascule du stockage** : pointer les stores vers la base, un
  domaine à la fois (référentiels d'abord, enregistrements en dernier), testé et
  validé à chaque étape. Hachage des mots de passe ici.
- **Phase 4 — Client/serveur** : extraction vers `server/` + PostgreSQL quand le
  multi-poste devient nécessaire.

## Extraction depuis HFSQL (pour l'import Phase 2)
1. **Export CSV depuis STCA** — le plus simple, aucun accès serveur requis.
2. **Driver ODBC HFSQL** (PC SOFT) — plus fidèle sur types et dates.
3. Lecture directe des `.FIC` — format propriétaire, **à éviter**.
