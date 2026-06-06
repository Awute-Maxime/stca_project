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

### Destinations
- 10 destinations au total
- Toutes utilisent le préfixe **"A"** pour l'immatriculation
- Codes identifiés : TO, KP, KE, NO, CK, KW, S\C, AFO (8/10)
- Chaque destination a un compteur séquentiel indépendant (A0001, A0002, ...)

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
- Demande **mot de passe de forçage** = `Awmax`
- Étape 1 : Choisir secteur : **STCA** ou **ASSURANCE**
- Étape 2 (STCA) : Choisir type : **Rapports détaillés**, **Rapports résumés**, **Rapport annuel**
- *(Exploration incomplète — interrompue pour sauvegarde)*

### Menu Assurances
- *(Non encore exploré)*

### Menu Outils+Config.
- *(Non encore exploré)*

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

## 9. Ce qui reste à explorer (Phase 2 incomplète)

- [ ] Rapports détaillés STCA (interrompu à l'étape 2)
- [ ] Rapports résumés STCA
- [ ] Rapport annuel STCA
- [ ] Secteur ASSURANCE dans les rapports d'analyse
- [ ] Menu **Assurances** — tous les sous-menus
- [ ] Menu **Outils+Config.** — tous les sous-menus
- [ ] Table **PARAMDESTINATION** — les 10 destinations complètes
- [ ] Table **TYPEASSURANCE** — types d'assurance et tarifs
- [ ] Formulaire d'enregistrement complet (champs, validation, impression)
- [ ] Item "Destination" de la roue de navigation

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

*Fin de session le 06/06/2026 — Reprise à partir de l'exploration des rapports d'analyse*
