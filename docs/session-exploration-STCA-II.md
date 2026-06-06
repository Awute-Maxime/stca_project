# Session d'exploration STCA II — Notes complètes
**Date :** 05–06 juin 2026  
**Objectif :** Explorer l'application STCA II existante avant de la reproduire en Electron

---

## 1. Présentation de l'application existante

- **Nom :** STCA II — Système de Transit et Contrôle des Automobiles
- **Pays :** Togo
- **Rôle :** Enregistrement des véhicules en transit international
- **Technologie actuelle :** WinDev 23 (PC SOFT), HFSQL Client/Serveur
- **Exécutable :** `D:\Programmation Doc\STCA\STCA-II\STCA-II.exe`
- **Base de données :** HFSQL C/S, serveur `DESKTOP-J87T6NG`, port 4900, BD `STCA M`

---

## 2. Fichiers de configuration

### `stca-wapp.ini`
```ini
[bd]
server= DESKTOP-J87T6NG
bdname=STCA M
user=Admin
password=Admin
mdpfiles=stca-maaarl/50
mdpcotec=xyzw

[config]
mode-simul=N

[Features]
Assurances=O
```

### `cfgimp.ini` — Configuration imprimantes
| Clé | Valeur |
|-----|--------|
| Facture | HP FACTURE STCA |
| TypeFacture | CB |
| CG | STCA HP CARTE GRISE |
| F1 | STCA HP FEUILLET BLEU (assur. bleu) |
| F2 | STCA HP FEUILLET ROSE (assur. rose) |
| F3 | HP LaserJet P2035 (cond. particulier) |
| F4 | \\BUREAUASS\EPSON LQ-2090FBLncMrs |
| CGFicheID | NPIC08BAA (HP Laser Pro 402dne) STCA Fiche ID |
| EnableCGFicheID | vrai |
| EnableImpFeuilletsAssuranceLaser | vrai |

---

## 3. Authentification & Comptes

| Compte | Nom | Mot de passe | Rôle |
|--------|-----|-------------|------|
| Connexion STCA | awute | Awmax | Utilisateur avec pouvoir |
| BD HFSQL | Admin | Admin | Administrateur DB |
| **Mot de passe forçage Config.** | — | **Awmax** | Accès Admin STCA |

> **Note importante :** Le mot de passe de forçage (`Awmax`) est le MÊME que le mot de passe de connexion de l'utilisateur `awute`. L'accès admin demande aussi une clé USB physique (message "clef d'administration") mais le mot de passe seul fonctionne en mode dégradé.

---

## 4. Structure de la base de données (tables identifiées via HFSQL CC)

### Tables principales
| Table | Description | Champs clés |
|-------|-------------|-------------|
| **ENREGISTREMENTS** | Table centrale — tous les transits | IDVehicule, NumImmatriculation, CodeTransit, Compo_ImmaCode, FlagSortie, DateSortie, NomUtilisateur, IDTYPEASSURANCE, MaisonTransit, Compo_CodeDate, Compo_TypeAssuranceCategorie, Compo_TypeAssuranceDateEnreg, Compo_SortieDateSortie |
| **Login** | Utilisateurs de l'application | NomUtilisateur, MotDePasse, Administrateur, CompteActif |
| **PARAMDESTINATION** | 10 destinations de transit | Code (ex: TO, KP, KE, NO, CK, KW, S\C, AFO), Nom, Préfixe lettre |
| **TYPEASSURANCE** | Types d'assurance | IDTYPEASSURANCE, Libellé, Tarif |
| **TYPEVEH** | Types de véhicules | Code, Libellé |
| **VEHASSURANCE** | Liaison véhicule-assurance | — |
| **CATVEH** | Catégories véhicules | — |
| **REFENREG** | Références d'enregistrement | IDREFENREG, NumRef |
| **MDT** | Maisons de transit | IDMDT, MaisonTransit |
| **ZoneImportation** | Zones d'importation | IDZoneImportation, Code, Nom, Utilisateur_Creation, Date_Creation, Utilisateur_Modification, Date_Modification, Description, Contact |
| **Pays** | Pays | — |
| **HistoriqueOperations** | Journal des opérations | — |

### Champs composites (Compo_*) dans ENREGISTREMENTS
Ces champs stockent des valeurs calculées/formatées :
- `Compo_ImmaCode` → `"A2050,TO"` (immatriculation + code destination)
- `Compo_CodeDate` → combinaison code + date
- `Compo_TypeAssuranceCategorie` → type assurance + catégorie
- `Compo_TypeAssuranceDateEnreg` → type assurance + date d'enregistrement
- `Compo_SortieDateSortie` → flag sortie + date de sortie

---

## 5. Règles métier critiques

### Numérotation des immatriculations
- Format : **1 lettre + 4 chiffres** = 5 caractères (ex: `A2050`, `B0134`)
- **NON unique globalement** — le même numéro peut exister pour plusieurs destinations
- **Clé unique = (NumImmatriculation, CodeTransit)** — chaque destination a son propre compteur
- Ex : `A2050` existe pour TO, KP, KE, NO, CK, KW, S\C → 7 véhicules avec la même immatriculation, destinations différentes
- Champ `Compo_ImmaCode` = `"A2050,TO"` → identifiant composite unique

### Destinations — PARAMDESTINATION complète (10/10)
| Code | Tarif | Destination | Lettre | N° Immat actuel |
|------|-------|-------------|--------|-----------------|
| AFO | 10 000 | Afolé | C | 7388 |
| CK | 10 000 | Cinkassé | T | 7467 |
| KA | 10 000 | Kambolé | E | 2182 |
| KE | 10 000 | Kétao | C | 3177 |
| KP | 10 000 | Kpadapé | C | 4419 |
| KW | 10 000 | Kwodjoviakope | C | 6637 |
| NO | 10 000 | Noépé | A | 3910 |
| TO | 10 000 | Tohoum | C | 7490 |
| S\C | 10 000 | Sanvi condji | A | 8039 |
| POL | 10 000 | Réexportation | A | 0003 |

**Notes :** Toutes à 10 000 FCFA. La colonne "Lettre" est probablement la lettre de la carte grise. Le "N° Immat actuel" est le dernier numéro d'immatriculation utilisé pour cette destination.

### Types de véhicules (TYPEVEH)
| Rang | Type |
|------|------|
| 1 | Voiture |
| 2 | Camion |
| 3 | Autre |

### Assureur (TYPEASSURANCE)
| Nom | Coordonnées |
|-----|------------|
| POOL TPV VT - MOTO | 01 BP 2689 Lomé Togo tél : 221 70 9... |

Paramètre global : **Imprimer Facture + Cond. Part. + Assurances = OUI**

### Données réelles (enregistrements archivés — exemples)
| Réf | Nom | Code | Marque | N° Chassis | Immat | N° Tri |
|-----|-----|------|--------|------------|-------|--------|
| 7132 | ABDULLAHI BABA | CK | FIAT | ZFA29000000302873 | A4107 | 00044 |
| 7186 | MAHAMANE Y. | CK | DAF | XLRTE33KSOE334822 | A4148 | 00008 |
| 7272 | SOUMANA ALFARI | CK | DAF | 00160937*** | A4197 | 00144 |
| 7322 | TOURE MAICK | CK | CHEVROLET | 2G1WL52K1W9331657 | A4226 | 00156 |
| 8842 | DOUNBIA OUMAR | CK | MERCEDES | WDB020182A1A474059 | A5053 | 01727 |
| 9651 | MAMOUDOU AYOUBA | CK | OPEL KADET | WOLOTD190J5308608 | A5501 | 42480 |
| 10340 | NOURADINE HACHINE | CK | HONDA | 5J6YH28543L048654 | A5943 | 03255 |

### Sortie des véhicules
- `FlagSortie = true` → véhicule sorti, **ne peut plus être modifié**
- `DateSortie` enregistre la date de sortie
- Règle de gestion : vérifier FlagSortie avant toute modification

### Documents générés
- **Facture** (imprimante HP FACTURE STCA, type CB)
- **Carte Grise** (imprimante STCA HP CARTE GRISE)
- **Feuillet Bleu** (assurance)
- **Feuillet Rose** (assurance)
- **Fiche ID véhicule** (HP Laser Pro 402dne)
- **État assurance Cond. Particuliers** (type ETAT_AssuranceCondPartLaserA4)

---

## 6. Menus de l'application

### Menu Enregistrement des véhicules
- Accès à la liste des véhicules enregistrés
- Formulaire d'enregistrement (roue de navigation centrale)

### Menu Analyse → Edition des rapports d'analyse
- Accès direct (pas de mot de passe en cours de session, seulement à la première ouverture)
- **Étape 1 — Secteur :** STCA | ASSURANCE | Annuler

**Secteur STCA :**
- Dialogue "Edition des rapports d'analyse" (date début, date fin, Période prédéfinie dropdown, Totaliser par : Jour / Mois / Destination)
- Boutons : Imprimer | Quitter
- Si pas de données → "Il n'y a pas de données à imprimer."
- Types disponibles (dialogue préalable) : **Rapports détaillés** | **Rapports résumés** | **Rapport annuel** | Annuler

**Secteur ASSURANCE :**
- Ouvre directement **"Gain généré par les assurances"**
- Colonnes : Réf, Nom et prénom, Adresse, Type, Marque et modèle, N° Chassis, Immatriculation, Destination, N° de Tri, Enregistré le, Montant
- Filtres : Date début / Date fin / Dropdown Assurance
- Total : **Gain Total** (en bas)
- Boutons : Rechercher | Imprimer | Quitter

### Menu Assurances → Montant à restituer
- Interface identique à "Gain généré par les assurances"
- Même colonnes, même filtres
- Total : **Montant Total à restituer** (en bas)
- Logique symétrique : gains vs remboursements

### Menu Outils+Config. — Structure complète
| Item | Description |
|------|-------------|
| Sauvegarde la Base de Données | Grisé (non accessible) |
| **Clef d'administration** | Configuration mot de passe forçage admin + "Ecrire Clé USB" |
| **Archivage** | Vue "Enregistrements archivés" avec données réelles (filtrable par date) |
| Fixer N° Référence | Réinitialisation du numéro de référence |
| *(Impression de plaque d'immatriculation)* | Séparateur grisé |
| Config. Poste N° IMMAT. | Configuration du poste pour numérotation immatriculation |
| **Configuration Assurances** | Liste assureurs + paramètre "Imprimer Facture+Cond.Part.+Assurances : OUI/NON" |
| **Types Véhicule** | Liste des types pour assurances |
| **Paramètres Destinations** | Liste complète des 10 destinations (code, tarif, nom, lettre, N° immat) |
| Config. Imprimantes | Configuration des imprimantes par type de document |

### Roue de navigation (écran principal)
- **Enregistrement** (en haut)
- **Destination** (gauche)
- **Analyse** (droite)
- **Liste Véhicules** (bas gauche)
- **Recherche IMMAT.** (bas droite)
- **Recherche N° Chassis** (bas centre)

---

## 7. Architecture décidée pour la reproduction

### Stack technique
| Couche | Technologie |
|--------|-------------|
| Desktop | **Electron** (.exe installable) |
| Frontend | **React + Ant Design + Framer Motion + Tailwind CSS** |
| Backend | **Node.js + Express** |
| ORM | **Prisma** |
| Base de données | **PostgreSQL** |
| Packaging | **Electron Builder** |

### Principes de déploiement
- **Client/Serveur** : mêmes clients Electron sur les postes, serveur Node.js+PostgreSQL
- **Flexible** : serveur local (LAN) OU serveur VPS en ligne — seule la config change
- **Données test** : Faker.js pour générer des données fictives (les 345 545 enregistrements existants ne seront PAS migrés)

### Préférences UI
- Interfaces **épurées, professionnelles, réactives et animées**
- Framer Motion pour les transitions
- Ant Design pour les composants

---

## 8. Statistiques de la base

- **345 545 véhicules** enregistrés au total (au moment de l'exploration)
- **2 connexions actives** au moment de l'exploration :
  - STCA-II.exe (STCA-II) depuis DESKTOP-J87T6NG [192.168.1.68]
  - CC280HF64.exe (CCHF = HFSQL Control Center) depuis DESKTOP-J87T6NG [192.168.1.68]

---

## 9. Ce qui reste à explorer (Phase 2 — état au 06/06/2026)

### Exploré dans la session du 06/06/2026
- [x] Menu Analyse → flux STCA (Edition des rapports, types de rapports)
- [x] Menu Analyse → flux ASSURANCE (Gain généré par les assurances)
- [x] Menu Assurances → Montant à restituer
- [x] Menu Outils+Config. → structure complète identifiée
- [x] Outils+Config. → Types Véhicule (Voiture/Camion/Autre)
- [x] Outils+Config. → Paramètres Destinations (**PARAMDESTINATION complète — 10 destinations**)
- [x] Outils+Config. → Configuration Assurances (POOL TPV VT - MOTO)
- [x] Outils+Config. → Clef d'administration (mot de passe forçage + USB)
- [x] Outils+Config. → Archivage (données réelles vues)

### Encore à explorer
- [ ] Outils+Config. → Fixer N° Référence
- [ ] Outils+Config. → Config. Poste N° IMMAT.
- [ ] Outils+Config. → Config. Imprimantes
- [ ] Menu ? (aide)
- [ ] Formulaire d'enregistrement complet (champs détaillés, validation, impression)
- [ ] Item "Destination" de la roue de navigation
- [ ] Item "Recherche IMMAT." de la roue
- [ ] Item "Recherche N° Chassis" de la roue
- [ ] Rapports résumés / Rapport annuel (avec données)

---

## 10. Notes techniques d'automatisation UI (Win32/PowerShell)

Points importants découverts lors de l'exploration :
- **MOUSEEVENTF_VIRTUALDESK (0x4000)** est OBLIGATOIRE pour les clics sur l'écran secondaire avec `mouse_event`. Sans ce flag, les coordonnées sont mappées sur l'écran primaire.
- Formule coordonnées multi-écrans : `ax = (screenX + 1920) * 65535.0 / 3840`
- Les contrôles WinDev (tree, tab bar) ignorent les messages Windows standards (LB_SETCURSEL, WM_LBUTTONDOWN) — utiliser mouse_event avec VIRTUALDESK
- `Add-Type` en PowerShell ne persiste pas entre sessions — redéfinir à chaque appel
- Écran secondaire : X=-1920 à 0, Y=0 à 1080 (DPI 96, pas de scaling)
- STCA main window : L=-1547, T=161, R=-266, B=891 (1281×730px)
- Menu "Analyse" : screen x=-1275, y=201

---

---

## 11. Notes techniques — coordonnées fenêtre (mise à jour 06/06/2026)

La fenêtre STCA a légèrement bougé depuis la session précédente :
- **Main window** : L=-1577, T=126, R=-296, B=856 (était L=-1547, T=161)
- **Menu Analyse** : screen x≈-1290, y≈168 (était -1275, 201)
- **Menu Assurances** : screen x≈-1210, y≈168
- **Menu Outils+Config.** : screen x≈-1110, y≈168
- BM_CLICK fonctionne sur les boutons enfants WinDev (classe Button)
- WM_SETTEXT modifie l'affichage mais pas la valeur interne WinDev (les dates ne sont pas prises en compte)
- CB_GETCOUNT/CB_GETLBTEXT : partiellement fonctionnel sur les ComboBox WinDev

---

*Dernière mise à jour : 06/06/2026 — Session 2 terminée*
