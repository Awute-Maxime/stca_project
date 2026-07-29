# Conception — Application « Pointage Sortie Véhicules » (ESCORT)

**Date :** 2026-07-28
**Statut :** Design validé (brainstorming) — en attente revue spéc avant `/planification`
**Type :** Nouvelle application Electron autonome de l'écosystème TCIT

---

## 1. Objectif

Reproduire et moderniser l'application **STCA II Pointage** : pointer la **sortie** des véhicules
qui ont fini leur processus d'immatriculation transit et sont **prêts à être escortés** par les
douaniers vers leur frontière de sortie. L'opérateur constitue une liste de véhicules (par scan
code-barre ou recherche), **valide leur sortie** dans la base, puis imprime le **Bordereau
d'Escorte** remis aux douaniers. Un onglet dédié édite les **listes de véhicules sortis** (jour /
période).

C'est une **application indépendante** qui **se connecte à la base STCA M** — contrairement à
l'app d'affichage (`STCA-Affichage`) qui n'a pas d'accès base.

---

## 2. Décisions de conception (validées)

| # | Décision | Choix retenu |
|---|----------|--------------|
| 1 | Connexion base | **Mock partagé d'abord** ; couche d'accès en **adaptateur** pour brancher la vraie HFSQL plus tard (vraie base = Phase 4 de l'écosystème) |
| 2 | Moment d'écriture de la sortie | **Bouton « Pointage Véh. »** écrit `FlagSortie=vrai` + `DateSortie=aujourd'hui`. « Générer Bordereau Escort » **imprime seulement** |
| 3 | Emplacement du code | **Projet Electron séparé `STCA-Pointage/`**, installeur indépendant, dépôt git propre |
| 4 | Méthodologie | **Maquette HTML validée d'abord**, puis Electron |
| 5 | Login | **Aucun login** en v1 (l'app s'ouvre sur le pointage) |
| 6 | Signature documents | **« TCIT · Pointage »** (charte TCIT, pas « STCA ») |
| 7 | Partage des données mock | **Fichier partagé sur disque** lu/écrit par l'app principale TCIT **et** par Pointage : un véhicule enregistré dans TCIT apparaît dans Pointage |

---

## 3. Architecture

### 3.1 Vue d'ensemble

```
┌────────────────────────┐        write-through        ┌──────────────────────────┐
│  App principale TCIT    │  ── enregistrement save ──▶ │  Fichier STCA M partagé   │
│  (STCA-Electron)        │                              │  %PROGRAMDATA%\TCIT\      │
│  + module main additif  │ ◀── (lecture optionnelle) ─  │  stca-m.json              │
└────────────────────────┘                              │  { enregistrements: [...] }│
                                                          └──────────────┬───────────┘
                                        read + write sortie              │  fs.watch (live)
                                        (FlagSortie, DateSortie)         ▼
                                                          ┌──────────────────────────┐
                                                          │  App STCA-Pointage        │
                                                          │  main: basePointage       │
                                                          │        (adaptateur)       │
                                                          │  renderer: 3 onglets +    │
                                                          │  liste + 2 documents      │
                                                          └──────────────────────────┘
```

### 3.2 Le fichier STCA M partagé (simulation de la base)

- **Rôle** : simule la table `ENREGISTREMENTS` de STCA M, partagée entre les deux apps.
- **Emplacement** : chemin machine partagé, `%PROGRAMDATA%\TCIT\stca-m.json`
  (constante `CHEMIN_BASE_MOCK`, dérivée de `process.env.PROGRAMDATA`, repli `os.homedir()/.tcit/`).
  Un seul fichier, atteignable par les deux apps (leurs `userData` respectifs ne sont pas partagés).
- **Format** :
  ```jsonc
  {
    "version": 1,
    "enregistrements": [
      {
        "numRef": "610270",
        "numTri": "2107",
        "immat": "T7471",           // NumImmatriculation
        "codeTransit": "CK",        // Destination
        "nomParc": "UNIPARK",
        "maisonTransit": "AFRIQUE ATTACHED",
        "nomPrenom": "KOLO KOSSI",
        "adresse": "Bub/Burkina-Faso",
        "marqueModele": "ACERBI 135PS",
        "chassis": "2M5XYZUDLAXDG1220",
        "dateEnreg": "2026-07-20",
        "flagSortie": false,
        "dateSortie": null
      }
    ]
  }
  ```
- **Accès** : chaque app lit/écrit le fichier depuis son **processus main** (Node `fs`), écriture
  **atomique** (fichier temporaire + `rename`) pour éviter la corruption. Un `fs.watch` pousse les
  changements au renderer via IPC → **synchro live** (un véhicule enregistré dans TCIT apparaît
  dans Pointage sans redémarrer).
- **Concurrence** : échelle mock → *last-write-wins* sur écriture atomique ; recharge complète du
  fichier avant chaque écriture pour ne pas écraser une modif concurrente sur d'autres lignes.
- **Amorçage** : si le fichier est absent au premier lancement, il est **semé** depuis un jeu
  embarqué (les véhicules exacts des captures + ~50 autres réalistes, dates récentes).

### 3.3 Couche d'accès en adaptateur (le *seam* pour la vraie base)

Interface unique côté main de STCA-Pointage — `basePointage` :

```ts
interface BasePointage {
  rechercherParImmat(immatComplet: string): Promise<EnregistrementM | null>   // ZIP + Rech immat
  rechercherParTri(numTri: string): Promise<EnregistrementM | null>           // Rech TRI
  marquerSortie(numRefs: string[], dateSortie: string): Promise<void>         // Pointage Véh.
  annulerSortie(numRefs: string[]): Promise<void>                             // dépointage éventuel
  listerSorties(debut: string, fin: string): Promise<EnregistrementM[]>       // Impressions
  onChangement(cb: () => void): () => void                                    // fs.watch → live
}
```

- **Aujourd'hui** : implémentation `basePointageMock` (le fichier partagé ci-dessus).
- **Demain** : implémentation `basePointageHfsql` (même interface) → **zéro réécriture d'UI**.

### 3.4 Touche additive à l'app principale TCIT (⚠️ signalée)

- **Additive uniquement** : nouveau module main `stcaMShared.ts` + IPC `stcaM:upsert`. À chaque
  **enregistrement sauvegardé**, on **upsert** la ligne dans le fichier STCA M partagé
  (write-through). Le store `localStorage` existant et **tous les flux validés restent intacts**.
- **Aucune lecture retour imposée** en v1 (le `PointagePage` interne de l'app principale n'est pas
  modifié). La lecture des sorties par l'app principale reste optionnelle / hors périmètre.
- Cette modification sera **explicitement isolée dans une tâche du plan**, appliquée après
  validation (règle des corrections cumulatives — cf. `feedback_corrections_cumulatives`).

### 3.5 Stack technique

- Electron 28 + React 18 + Ant Design 5 + TypeScript, electron-vite, Vitest.
- Squelette cloné sur `STCA-Affichage` (mêmes tsconfig / electron.vite / scripts), + `antd` + `dayjs`.
- Impression documents : fenêtre **Aperçu HTML** imprimée en PDF via l'API d'impression Electron /
  `window.print` (même approche que les `*ApercuWindow` de l'app principale).

---

## 4. Interface — 3 onglets + zone commune

### 4.1 En-tête & structure

Bandeau titre « **Pointage Sortie Véhicules › ESCORT** », onglets : **Saisie ZIP** ·
**Rech. N° TRI/IMMAT** · **Impressions**. Zone commune (boutons + liste) partagée sous les 2
premiers onglets.

### 4.2 Onglet « Saisie ZIP »

- Libellé : « ZIP Fiche ID Jaune agrafée C.G. (ex : A0001CK) afin de rechercher le véhicule ».
- Champ « Véhicule à pointer » (immat complète = plaque + code frontière) + bouton
  **« Rech. + Pointer »**.
- **Comportement scan** : un scanner code-barre se comporte comme un clavier → saisie du code +
  `Entrée` déclenche `rechercherParImmat`. Le véhicule trouvé est **ajouté à la liste de travail**
  (pas d'écriture base à ce stade). Focus auto sur le champ, vidé après chaque scan (cadence).

### 4.3 Onglet « Rech. N° TRI/IMMAT »

- Champ « Véhicule à rechercher » + bouton **« Rechercher »** (par N° TRI ex. `125`, ou immat
  complète ex. `A0001CK`).
- **« Suppr. sélection »** (➖) : retire la ligne sélectionnée de la liste de travail.
- **« Pointage Véh. »** : pour les lignes **cochées** (case « Sortie »), écrit
  `FlagSortie=vrai` + `DateSortie=aujourd'hui` via `marquerSortie`. Les lignes pointées passent en
  **surbrillance** (jaune, comme l'ancien) et deviennent le contenu du bordereau.

### 4.4 Zone commune (boutons + liste de travail)

- **« Générer Bordereau Escort »** (vert) : demande confirmation (« Êtes-vous sûr de vouloir
  générer le PDF ? » Oui/Non) puis **imprime** le Bordereau d'Escorte des lignes pointées.
  **N'écrit pas** en base.
- **« Vider Liste Pointage »** : vide la **liste de travail** uniquement. **N'annule pas** les
  sorties déjà écrites en base.
- **Liste de travail** — colonnes : `Sortie` (case) · `Réf.` · `N° TRI` · `N° Immatriculation` ·
  `Destination` · `NomDuParc` · `MaisonTransit` · `Nom et prénom` · `Marque / Modèle` ·
  `N° Chassis` · `Enregistré le`.

### 4.5 Onglet « Impressions »

- Choix 1 : **Véhicules sortis aujourd'hui** / **Véhicules sortis sur une période** (2 dates).
- Choix 2 : **Imprimé standard** / **Imprimé par parc**.
- Bouton **« Imprimer »** → génère la **Liste des véhicules sortis** (cf. §5.2).

---

## 5. Documents (reproduction fidèle)

### 5.1 Bordereau d'Escorte

- **En-tête** : logo TCIT + « **Douanes Togolaises** » ; titre « **Bordereau d'Escorte** » ;
  « Édition du : [jour date longue] [heure] » (ex. « Mardi 28 Juillet 2026  00:57 »).
- **Colonnes** : `N° TRI` · `N° Immatriculation` · `Destination` · `Nom Parc` · `Maison Transit`
  · `Marque / Modèle` · `N° Chassis`.
- **Pied** : « Nombre de véhicules escortés : N » (à gauche) · « **TCIT · Pointage** » + version (à droite).
- **Source** : lignes **pointées** de la liste de travail.

### 5.2 Liste des véhicules sortis

- **Titre** : « Liste des véhicules sortis pour la journée du : JJ/MM/AAAA » **ou** « … pour la
  période du : JJ/MM/AAAA au JJ/MM/AAAA ».
- **Colonnes** : `Nom et prénom` · `Adresse` · `N° de Tri` · `Immatriculation` · `Destination` ·
  `Marque et modèle` · `N° Chassis` · (`Parc` — **seulement en mode standard/période**) ·
  `Enregistré le` · `Sortie le`.
- **Mode « par parc »** : regroupé par `NomDuParc` (sous-titre « Nom du parc : … », sous-total
  « Nombre de véhicules sortis de ce parc : n » par groupe).
- **Pied** : « Nombre de véhicules sortis : N » + « Édition du [date] [heure] » + pagination.
- **Source** : `listerSorties(debut, fin)` filtré sur `DateSortie`.

---

## 6. Règles métier & cas limites

| Cas | Comportement |
|-----|--------------|
| Recherche / ZIP sans résultat | Message clair (« Véhicule introuvable »), rien ajouté, champ conservé |
| Véhicule **déjà sorti** (`FlagSortie=vrai`) | Avertissement ; affiché grisé « déjà sorti », **non re-pointable** |
| Même véhicule scanné / recherché 2× | Pas de doublon : la ligne existante est simplement re-sélectionnée |
| « Générer Bordereau » sans ligne pointée | Bloqué, message « Aucun véhicule pointé » |
| « Pointage Véh. » sans case cochée | Bloqué, message « Cochez au moins un véhicule » |
| Fichier STCA M absent | Amorçage automatique depuis le jeu embarqué |
| Écriture concurrente | Recharge du fichier + écriture atomique (last-write-wins par ligne) |

---

## 7. Design visuel

- **Charte TCIT** : sidebar/bandeaux `#1B3A6B`, accent `#2563EB`, or `#F59E0B`, fond clair
  `#F0F2F5`. Cohérence avec l'écosystème (cf. `feedback_stca_design`, `feedback_coherence_reference_existant`).
- **Interface vivante** (cf. `feedback_interface_vivante`) : réactivité du scan (focus/vidage,
  petit « flash » à l'ajout), hover sur lignes/boutons, badges **destination colorés**
  (couleur de plaque), surbrillance des lignes pointées, compteurs qui s'animent.
- **Liseré TCIT** `1.5px #1B3A6B` autour de la fenêtre (comme l'écosystème).

---

## 8. Stratégie de tests

- **Unitaires (Vitest)** : `basePointageMock` (recherche immat/TRI, marquer/annuler sortie,
  listerSorties par plage, amorçage, écriture atomique) ; helpers de dédoublonnage de la liste de
  travail ; formatage des documents (regroupement par parc, totaux).
- **E2E (CDP)** : lancer l'app, scanner un code (ajout liste), rechercher par TRI, cocher +
  « Pointage Véh. » (vérifier écriture `flagSortie`/`dateSortie` dans le fichier), « Générer
  Bordereau » (vérifier PDF), onglet Impressions (journée + période, standard + par parc).
- **Intégration partage** : enregistrer un véhicule dans l'app principale TCIT → vérifier qu'il
  apparaît (live) dans la recherche de Pointage.

---

## 9. Périmètre v1 / hors périmètre

**Dans la v1** : les 3 onglets, la liste de travail, les 2 documents, le fichier STCA M partagé +
adaptateur, la touche additive write-through côté app principale, amorçage + jeu de démonstration.

**Hors v1** : vraie connexion HFSQL (Phase 4), login/traçabilité agent, dépointage massif avancé,
export Excel, réglages imprimante fins (on reste sur l'aperçu + impression PDF standard).

---

## 10. Suite

1. Revue de cette spéc par l'utilisateur.
2. **Maquette HTML** des 3 onglets + 2 documents → validation visuelle.
3. `/planification` → plan d'implémentation détaillé (micro-tâches, TDD).
4. Construction : app STCA-Pointage (adaptateur mock + UI + documents), puis touche additive TCIT.
