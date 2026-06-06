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
| Item | Description | Exploré |
|------|-------------|---------|
| Sauvegarde la Base de Données | Grisé (non accessible) | — |
| **Clef d'administration** | Configuration mot de passe forçage admin + "Ecrire Clé USB" | ✓ session 2 |
| **Archivage** | Vue "Enregistrements archivés" avec données réelles (filtrable par date) | ✓ session 2 |
| **Fixer N° Référence** | Dialogue "N° de référence en cours" — réinitialise le compteur | ✓ session 3 |
| *(Impression de plaque d'immatriculation)* | Séparateur grisé mais cliquable (sans action) | — |
| **Config. Poste N° IMMAT.** | "Activation du mode assurance" — IP PC affichage IMMAT + activation assurance | ✓ session 3 |
| **Configuration Assurances** | Liste assureurs + paramètre "Imprimer Facture+Cond.Part.+Assurances : OUI/NON" | ✓ session 2 |
| **Types Véhicule** | Liste des types pour assurances | ✓ session 2 |
| **Paramètres Destinations** | Liste complète des 10 destinations (code, tarif, nom, lettre, N° immat) | ✓ session 2 |
| **Config. Imprimantes** | Configuration des éditions et imprimantes (7 imprimantes, type feuillets, code barre) | ✓ session 3 |
| **Exporter les enregistrements de véhicules** | Export vers serveur ou poste (sélection répertoire destination) | ✓ session 3 |
| **Pointage des véhicules** | Pointage/Dépointage sortie véhicules (par N° tri ou N° immat complet) | ✓ session 3 |

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

### Exploré en session 3 (06/06/2026)
- [x] **Page de connexion — bouton "Gestion des utilisateurs"** (fonctionnalité conditionnelle)
- [x] **Gestion des utilisateurs** — liste complète 18 utilisateurs (table Login)
- [x] **Modifier le mot de passe** — dialogue de changement de mot de passe
- [x] **Outils+Config. → Fixer N° Référence** — N° en cours : 610 266
- [x] **Outils+Config. → Config. Poste N° IMMAT.** — IP=192.168.0.25, Port=8000, Assurance activée
- [x] **Outils+Config. → Config. Imprimantes** — 7 configurations, laser, code-barres
- [x] **Outils+Config. → Exporter les enregistrements** (nouveau item découvert)
- [x] **Outils+Config. → Pointage des véhicules** (nouveau item découvert)
- [x] **Menu ? → Copyright / Version / ID réseau** — Version REL 3 : 3.0.20.0, WinDev 23.0.370.1

### Encore à explorer
- [ ] Formulaire d'enregistrement complet (champs détaillés, validation, impression)
- [ ] Item "Destination" de la roue de navigation
- [ ] Item "Recherche IMMAT." de la roue
- [ ] Item "Recherche N° Chassis" de la roue
- [ ] Rapports résumés / Rapport annuel (avec données)
- [ ] Menu Fichier → "Marques et modèles de véhicules" (NON exploré)

---

## 10. Page de connexion — fonctionnalités détaillées

### Interface de base (fenêtre "Identification de l'utilisateur")
| Élément | Description |
|---------|-------------|
| Nom d'utilisateur | Champ texte libre |
| Mot de passe | Champ texte masqué (avec icône œil pour révéler) |
| Modifier le mot de passe | Lien/bouton visible en permanence |
| Mémoriser le nom d'utilisateur | Checkbox (mémorise le login entre sessions) |
| Valider | Bouton connexion (vert ✓) |
| Annuler | Bouton annuler (rouge ✗) |
| **Gestion des utilisateurs** | **Bouton conditionnel — apparaît uniquement quand le login d'un utilisateur "Administrateur=✓" est tapé** |

### Comportement conditionnel — bouton "Gestion des utilisateurs"
- **Déclencheur :** dès que l'utilisateur tape un nom de compte ayant `Administrateur = ✓` dans la table Login
- **Disparaît** si le champ est vidé ou si un nom de compte sans pouvoir est tapé
- **Accès :** nécessite que le mot de passe soit aussi rempli (validation des credentials avant ouverture)
- **Emplacement dans l'interface :** ligne inférieure, à gauche de "Valider"

### Interface "Gestion des utilisateurs"
Fenêtre modale affichant la table `Login` complète :

| Colonne | Type | Description |
|---------|------|-------------|
| Login Utilisateur | Texte | Identifiant de connexion |
| Mot de passe | Texte masqué (•••) | Editable inline par double-clic |
| Administrateur | Checkbox | Si ✓ → bouton "Gestion des utilisateurs" apparaît au login |
| Compte actif | Checkbox | Si □ → le compte ne peut pas se connecter |

**Boutons :** Supprimer | Fermer  
**Edition :** double-clic sur une ligne → édition inline des champs  
**Ajout :** ligne vide en bas de la liste (saisie directe)  
**Pas de bouton "Ajouter" séparé** — ajout via la ligne vide

### Liste complète des utilisateurs (18 comptes)
| Login | Administrateur | Compte actif |
|-------|---------------|--------------|
| Administrateur | ✓ | ✓ |
| Authority.Config | ✓ | ✓ |
| Odette | ✓ | ✓ |
| akilou | □ | ✓ |
| aminou | ✓ | ✓ |
| awute | ✓ | ✓ |
| awute2 | ✓ | ✓ |
| celestine | □ | ✓ |
| clemence | □ | □ |
| emmanuel | □ | ✓ |
| jeanlin | ✓ | ✓ |
| mathieu | □ | ✓ |
| mohamed | □ | □ |
| nicole | □ | □ |
| oliadmin | ✓ | ✓ |
| victor | □ | ✓ |
| victoradm | ✓ | ✓ |
| visiteur | □ | □ |

**Comptes administrateurs (9) :** Administrateur, Authority.Config, Odette, aminou, awute, awute2, jeanlin, oliadmin, victoradm  
**Comptes désactivés (4) :** clemence, mohamed, nicole, visiteur

### Interface "Modification d'un mot de passe"
Accessible via le lien "Modifier le mot de passe" sur la page de connexion :
- **Nom d'utilisateur :** pré-rempli avec le login en cours de saisie
- **Mot de passe actuel :** champ texte masqué
- **Nouveau mot de passe :** champ texte masqué
- **Confirmation du nouveau mot de passe :** champ texte masqué
- Boutons : Valider | Annuler

---

## 11. Notes techniques d'automatisation UI (Win32/PowerShell)

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

---

## 12. Nouvelles découvertes — Session 3 (06/06/2026)

### Application — Identité complète
| Champ | Valeur |
|-------|--------|
| Nom officiel | **COTEC II - TOGO** (logo) |
| Nom système | STCA II |
| Copyright | STCA II - Copyright COTEC Togo 2022 |
| Version | **REL 3 : 3.0.20.0** |
| Technologie | WinDev **23.0.370.1** |
| OS hôte | Windows 10 x64 build 22621 (W11 22H2) |
| IP | 192.168.1.68 |
| NetName | \\DESKTOP-J87T6NG\ |

### Fixer N° Référence
- Dialogue : "Attention ! Contrôler la table DB 'enregistrement' avant de modifier ce N° !"
- **N° de référence en cours : 610 266** (compteur global des enregistrements)
- Boutons : Valider | Annuler
- Remarque : bien plus élevé que les 345 545 véhicules → le compteur inclut toutes les opérations historiques

### Config. Poste N° IMMAT.
- Titre fenêtre : "Activation du mode assurance"
- ✓ **Activer le mode de fonctionnement avec Assurance** (coché)
- **Coordonnées du PC Affichage IMMAT :**
  - Adresse IP PC : **192.168.0.25** (réseau différent ! 192.168.0.x vs serveur 192.168.1.x)
  - N° Port PC : **8000**
  - Bouton "Tester"
- Boutons : Valider | Fermer

### Config. Imprimantes ("Configuration des éditions et imprimantes")
| Configuration | Valeur |
|---------------|--------|
| Facture | HP FACTURE STCA |
| Carte Grise | STCA HP CARTE GRISE |
| Feuillet assurance N°1 (Bleu) | STCA HP FEUILLET BLEU |
| Feuillet assurance N°2 (Rose) | STCA HP FEUILLET ROSE |
| Type feuillets assurance | ● Laser (○ Rouleau) |
| Imprimante F3 | HP LaserJet P2035 |
| Imprimante CGFicheID | NPIC08BAA (HP Laser Pro 402dne) |
| ✓ Imprimer Fiche ID Véhicule | Activé |
| Nom Etat Cond. Part. | ETAT_AssuranceCondPartLaserA4 |
| Etat Facture Global | ● Avec Code Barre (○ Sans Code Barre) |
| Imprimante Windows par défaut | Imprimante Facture 2 STCA |

### Exportation des enregistrements de véhicules
- Sélectionner répertoire de destination (browser dossier)
- Bouton **Sauvegarde Serveur** → export vers le serveur
- Bouton **Exportation Poste** → export vers le poste local
- Bouton Quitter

### Pointage / Dépointage de la sortie d'un ou plusieurs véhicules
- Recherche par **N° de tri** (ex: 125) ou **N° d'immatriculation complet** (ex: A0001CK)
- Format N° immat complet : `{Lettre}{4chiffres}{CodeDestination}` (ex: A0001CK = A + 0001 + CK)
- Radio : ● Véhicules sortis aujourd'hui | ○ Véhicules sortis sur une période
- Bouton **Sortie** → marque le véhicule trouvé comme sorti (FlagSortie = true)
- Colonnes : Sortie | Ref | N° de Tri | N° d'immatriculation | Destination | Nom et prénom | Adresse | Marque et modèle | N° Chassis | Enregistré le
- Lien direct avec champ `FlagSortie` de la table ENREGISTREMENTS

### Menu ? (Aide)
| Item | Contenu |
|------|---------|
| Copyright | "STCA II - Copyright COTEC Togo 2022" |
| Version | COTEC II - TOGO, Version REL 3 : 3.0.20.0 + connexion DB |
| ID réseau | Windows version, WinDev version, IP PC, NetName |

### Coordonnées menu Outils+Config. (calibrées session 3)
| Item | Screen Y (approx) |
|------|-------------------|
| Archivage | y=235 |
| Fixer N° Référence | **y=275** |
| Impression plaque (grisé) | y=315-325 |
| Config. Poste N° IMMAT. | **y=335** |
| Configuration Assurances | y=355 |
| Types Véhicule | y=375 |
| Paramètres Destinations | **y=415** |
| Config. Imprimantes | **y=435** |
| Exporter enregistrements | **y=475** |
| Pointage des véhicules | **y=495** |
| Menu "?" items centre x | x=-1043 |

---

*Dernière mise à jour : 06/06/2026 — Session 3 terminée (Outils+Config. complet, menu ? complet)*
