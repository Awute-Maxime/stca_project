# Design Doc — Décodeur VIN efficace (marque + modèle + année sur ≥ 60 %)

**Date :** 2026-08-01
**Statut :** ✅ VALIDÉ + **PROUVÉ sur données réelles**. Exécution par sous-agents.

> **RÉVISION (preuve empirique, 2026-08-01).** L'utilisateur a fourni une table de correspondance de **100 533 VIN**
> (VIN, Marque, Modèle, **Année**…). Expérience train/test (index sur 80 %, mesuré sur 20 % = ~19 649 VIN jamais vus) :
> **Marque 99 % · Modèle 93 % · Année ±1 79 % · TRIPLE 77 %** (dépasse la cible 60 %). Deux corrections vs la conception
> initiale : (1) le **modèle n'est PAS le goulot** — l'index seedé sur le corpus l'écrase (93 %) ; (2) **l'année EST le
> goulot** : la **position 10 n'est fiable qu'en Amérique du Nord** (WMI 1-5, 14 % du parc → 99 % ; ailleurs 35 %),
> confirmé par l'expérience métier de l'utilisateur. **Année = NA→position 10, sinon apprise par signature (médiane +
> plage, pos10 en appoint).** L'index est **seedé en masse depuis le corpus** (pas seulement l'apprentissage à l'usage).
> Ajout validé : **bouton « site constructeur »** (ouvre toyodiy & co. dans le navigateur, sans scraping — le site bloque
> les robots, 403) + providers en ligne pluggables (N2c). **Plan d'exécution à jour :**
> `docs/superpowers/plans/2026-08-01-decodeur-vin-efficacite.md` (v2, recette prouvée).

---

## 1. Objectif & définition du succès

Un décodeur est **efficace** quand, sur les vrais châssis du transit, il fournit au **minimum 60 %** du temps le triplet **marque + modèle + année** (et davantage : pays, usine, carrosserie, catégorie, confiance, source).

Le **60 %** n'est pas une estimation : c'est une **porte de validation mesurée** sur un échantillon de châssis réels (voir Chantier 5). Objectif secondaire : produire une **brique de décodage réutilisable** pour le futur projet VIN de l'utilisateur.

## 2. Contraintes (réponses utilisateur, 2026-08-01)

- **Pas d'accès aux 338k de l'ancienne base HFSQL distante** pour l'instant → on ne mine pas l'historique tout de suite.
- **Gratuit d'abord** : local + NHTSA vPIC (gratuit, sans clé). Pas d'API payante au départ.
- **Connectivité intermittente** : le **local doit être solide** ; l'online est un secours opportuniste.

## 3. Diagnostic — où est réellement la difficulté

| Cible | Comment on l'obtient | Difficulté |
|-------|----------------------|------------|
| **Année** | Position 10 du VIN (norme ISO 3779) | Quasi gratuite, hors ligne. Déjà décodée mais **sans désambiguïsation** (une lettre peut valoir 1980-2000 **ou** 2010-2030). |
| **Marque** | WMI (positions 1-3) | Facile hors ligne **si** la table WMI est complète. Actuelle = 79 entrées curatées seulement. |
| **Modèle** | VDS (positions 4-8), **propre à chaque constructeur**, aucun standard universel | **LE goulot.** Aucun champ `modele` dans le décodeur aujourd'hui. |

**Conclusion :** « 60 % marque+modèle+année » ≈ « **résoudre le MODÈLE sur 60 %+ des châssis** ». Le reste est presque acquis.

## 4. Architecture — 4 niveaux + moteur apprenant

```
decoderVin(vin)  [asynchrone]
 ├─ N0  Structure + ANNÉE (pos.10 + désambiguïsation pos.7)      → local, ~100 %
 ├─ N1  MARQUE + pays via table WMI massive                      → local, ~90 %+
 ├─ N2  MODÈLE :
 │       a) Index modèle appris (signature VIN → marque/modèle)  → local, monte à l'usage
 │       b) NHTSA vPIC en secours si en ligne + modèle manquant  → online
 └─ N3  Apprentissage (cliquet) : chaque décodage NHTSA réussi
         ET chaque enregistrement agent nourrissent l'index      → gratuit, calibré parc réel
```

**Le moteur apprenant (N3) est le cœur.** Sans le dump historique, l'index se remplit tout seul via deux sources gratuites :
1. **Chaque enregistrement fait dans l'app** : l'agent saisit `chassis` + `marqueModele` (hook après `enregistrementAdd`, [enregistrements.ts:199](../../src/main/enregistrements.ts#L199)).
2. **Chaque décodage NHTSA réussi** (quand le poste est en ligne).
3. **Amorçage immédiat** : si la base SQLite de l'app contient déjà des enregistrements (import STCA M via `ImportAssistant`), on **sème l'index** à partir d'eux au démarrage.

L'app utilise **Prisma + SQLite** ([prisma/schema.prisma:30](../../prisma/schema.prisma#L30)) → l'index est un **nouveau modèle Prisma**, pas un fichier annexe.

---

## 5. Chantier 1 — Année fiable

**Fichier :** `src/renderer/src/mock/vinDecoder.ts`

Aujourd'hui `ANNEES[vin[9]]` suppose « lettre = 2010-2039 » — faux pour un véhicule d'avant 2010. Le VIN encode l'année en position 10 sur un cycle de 30 ans ; la **règle de désambiguïsation standard** utilise la **position 7** :
- **Position 7 = lettre** → plage récente (2010-2039).
- **Position 7 = chiffre** → plage ancienne (1980-2009).

Deux tables :
```ts
// A..Y (sans I,O,Q,U,Z), puis 1..9
const AN_RECENT = { A:2010, …, Y:2030, '1':2031, …, '9':2039 }
const AN_ANCIEN = { A:1980, …, Y:2000, '1':2001, …, '9':2009 }
function decoderAnnee(vin: string): { annee: string; incertaine: boolean } {
  const c = vin[9], pos7EstLettre = /[A-Z]/.test(vin[6])
  const table = pos7EstLettre ? AN_RECENT : AN_ANCIEN
  let an = table[c]
  // Garde-fou : pas d'année future au-delà de l'an prochain
  if (an && an > new Date().getFullYear() + 1) an = AN_ANCIEN[c]
  return an ? { annee: String(an), incertaine: false } : { annee: '—', incertaine: true }
}
```
Ajoute `anneeIncertaine: boolean` à `ResultatVin` (note secondaire dans l'UI, non bloquante).

## 6. Chantier 2 — Table WMI massive

**Fichiers :** créer `src/renderer/src/mock/wmiBase.ts` (jeu public complet, ~des milliers de WMI → `{ marque, pays }`) ; garder `WMI_TABLE` curatée comme **surcouche** (catégorie/confiance pour le parc transit).

`trouverInfo` : cherche d'abord la surcouche curatée (préfixes 6→3, prioritaire), sinon `wmiBase` (clé 3 car.). La surcouche apporte `categorie`/`confiance` ; `wmiBase` apporte marque+pays pour la longue traîne.

Source : jeu WMI public (registre ISO/SAE, listes ouvertes) intégré à la compilation (aucun appel réseau au runtime). Volume attendu : quelques milliers d'entrées → objet bundlé, coût négligeable.

## 7. Chantier 3 — Champ `modele`

Ajouter `modele: string` à `ResultatVin` (défaut `'—'`), rempli par l'index (N2a) puis NHTSA (N2b). Nouvelle ligne « Modèle » dans la fenêtre décodeur (`DecodeurVinWindow.tsx`), et `appliquerEnLigne` renseigne `modele` depuis la réponse NHTSA (`vinOnline.ts` renvoie déjà `modele`).

## 8. Chantier 4 — Index modèle apprenant (le cœur)

**8.1. Modèle Prisma** (`prisma/schema.prisma`) :
```prisma
model VinIndex {
  id            Int      @id @default(autoincrement())
  signature     String   // positions 1-8 (WMI + VDS sans chiffre de contrôle)
  marqueModele  String   // texte, comme saisi/NHTSA (ex. "TOYOTA - RAV4")
  categorieRang Int?     // ← CATVEH.RANG (souple), pour déduire Voiture/Camion/Autre
  source        String   // 'saisie' | 'nhtsa'
  nbVus         Int      @default(1)
  majLe         DateTime @updatedAt
  @@unique([signature, marqueModele])
  @@index([signature])
  @@map("vin_index")
}
```
Migration Prisma dédiée (SQLite, additive, sans risque sur l'existant).

**8.2. Signature** : `signature(vin) = vin.slice(0,8)` (WMI 1-3 + VDS 4-8, hors chiffre de contrôle pos.9). Généralise sur l'année/l'usine/le n° de série, capture la lignée modèle. **Repli grossier** `signature6 = vin.slice(0,6)` en second recours (si aucun hit en 1-8).

**8.3. Module main** `src/main/vinIndex.ts` :
- `apprendre(vin, marqueModele, categorieRang, source)` → upsert `(signature, marqueModele)`, `nbVus++`.
- `chercher(vin)` → lit `signature(1-8)` puis repli `signature6` ; renvoie le `marqueModele` **majoritaire** + `part = nbVus_top / total` (→ confiance).
- `semer()` → au démarrage, parcourt la table `Enregistrement` existante et `apprendre(...)` pour chaque `(vin, marqueModele)` non vide (amorçage gratuit).
- `importer(rows)` → import en masse futur (les 338k quand accessibles).

**8.4. IPC** (`main/index.ts` + `preload` + `api/electron.ts`) :
- `vin:indexLookup(vin)` → `{ marqueModele, categorieRang, part } | null`.
- `apprendre` appelé **côté main directement** (pas d'IPC renderer) depuis :
  - `enregistrementAdd` après succès ([enregistrements.ts:199](../../src/main/enregistrements.ts#L199)) → source `'saisie'`.
  - le handler `vin:decodeOnline` quand NHTSA réussit → source `'nhtsa'`.

**8.5. Lecture dans le décodeur** : `decoder()` (déjà async) appelle `electronApi.vinIndexLookup(vin)` après le décodage WMI local ; si un modèle est trouvé, il renseigne `modele` (+ renforce marque/catégorie + confiance selon `part`). L'index est prioritaire sur NHTSA pour le modèle **hors ligne** ; NHTSA complète en ligne si l'index est muet.

## 9. Chantier 5 — Harnais de mesure

**Fichier :** `scripts/vin-benchmark.mjs` (+ éventuel test vitest).

Entrée : jeu `{ vin, marqueModeleAttendu, anneeAttendue? }` — depuis (a) un **export échantillon** fourni par l'utilisateur, ou (b) directement la table **`Enregistrement`** de l'app si elle est peuplée (mesure immédiate sur données réelles).

Sortie (rapport lisible + JSON) :
- % structure valide, % **marque**, % **modèle**, % **année**, **% les 3 ensemble** (← la cible 60 %).
- Justesse : correspondance floue marque/modèle décodé vs texte attendu (normalisation casse/accents/ponctuation + recouvrement de jetons).
- Trois colonnes : **local seul** / **local + index** / **local + index + NHTSA**.

## 10. Flux de données

**Décodage** (async) : `nettoyer → structure → année(N0) → WMI(N1) → index(N2a) → [si en ligne & modèle manquant] NHTSA(N2b)`. Aucun appel réseau côté renderer (CSP) : NHTSA reste dans le main via `vin:decodeOnline`.

**Apprentissage** (cliquet) : `enregistrementAdd` réussi **ou** NHTSA réussi → `vinIndex.apprendre(...)`. Au démarrage : `vinIndex.semer()` depuis `Enregistrement`.

## 11. Gestion des erreurs & cas limites

- VIN non valide (≠17, I/O/Q) → structure invalide, aucun apprentissage.
- `marqueModele` vide ou générique (« INCONNU », « … ») → **ne pas apprendre** (liste de rejets).
- Signature déjà vue avec un autre libellé → deux lignes concurrentes, la majorité l'emporte (auto-nettoyage des saisies fautives).
- Index muet + hors ligne → on renvoie marque+année sans modèle (`modele: '—'`), honnêtement.
- Position 10 = caractère non-année (ex. `0`) → `annee: '—'`, `anneeIncertaine: true`.

## 12. Stratégie de tests (TDD)

- **N0 Année** : VIN pos10=lettre + pos7=chiffre → ancien ; pos7=lettre → récent ; garde-fou année future ; pos10 invalide → '—'.
- **N1 WMI** : hits surcouche curatée (catégorie conservée) ; hit `wmiBase` (marque+pays, catégorie nulle) ; inconnu → région.
- **N4 Index** : `apprendre` puis `chercher` renvoie le majoritaire ; repli signature6 ; libellé rejeté non appris ; `semer` idempotent.
- **N5 Harnais** : jeu synthétique → pourcentages attendus ; matching flou (« TOYOTA - RAV4 » ≈ « toyota rav4 »).

## 13. Séquencement (→ `/planification`)

1. **Année fiable** (vinDecoder, TDD).
2. **Table WMI massive** (wmiBase + fusion, TDD).
3. **Champ `modele`** dans `ResultatVin` + UI + branchement NHTSA.
4. **Index apprenant** : modèle Prisma + migration → `vinIndex.ts` (apprendre/chercher/semer/importer) → IPC → hooks (enregistrementAdd, vin:decodeOnline) → lecture dans `decoder()`.
5. **Harnais de mesure** + amorçage/mesure sur données réelles → **premier chiffre**.

## 14. Risques & décisions ouvertes

- **Granularité de signature** : 1-8 peut être trop fin (variantes de finition) → repli 1-6 prévu ; à **affiner après la première mesure**.
- **Qualité des libellés `marqueModele`** (texte libre, fautes) : normalisation + liste de rejets ; la majorité corrige.
- **Mesure du 60 %** : dépend d'un échantillon réel (export utilisateur **ou** table `Enregistrement` peuplée). **Action : vérifier si l'import STCA M → SQLite a déjà été fait.**
- **Dossier `mock/`** : `vinDecoder.ts` n'est plus un mock ; extraction future vers une lib `vin/` réutilisable (futur projet) — hors périmètre ici.

## 15. Ce qu'il reste à fournir

- Idéalement un **échantillon de vrais châssis + marque/modèle** (même 30-50, ou un export CSV) pour mesurer tôt.
- Sinon : on **sème + mesure** depuis la table `Enregistrement` de l'app si elle contient déjà des données importées.
