# Plan d'Implémentation : Décodeur VIN — table locale élargie + secours en ligne NHTSA

**Objectif :** Rendre le décodeur de châssis (VIN) réellement efficace : (1) reformuler la validation
(la structure prime, le chiffre de contrôle n'est bloquant qu'en Amérique du Nord), (2) élargir fortement la
table WMI locale (hors ligne), (3) ajouter un **secours automatique en ligne** (API NHTSA vPIC) déclenché quand
le local ne suffit pas ET que le PC est connecté.

**Architecture :** Le décodage local reste PUR et hors ligne (`mock/vinDecoder.ts`). Le décodage en ligne se fait
dans le **processus main** (fetch NHTSA — obligatoire car la CSP renderer `default-src 'self'` interdit le réseau
externe), exposé au renderer par IPC `vin:decodeOnline`. La fenêtre `DecodeurVinWindow` orchestre : décode local →
si constructeur/type introuvable ET `navigator.onLine` → appelle l'IPC en ligne → fusionne/affiche, avec badge de
source, cache localStorage et indicateur de chargement.

**Stack :** Electron 28 (main : global `fetch` Node 18), React + TS, Vitest.

**Périmètre :** correctif+amélioration d'une feature existante (le décodeur), demandé par l'utilisateur. Aucune
autre partie de l'app principale n'est modifiée.

---

## Cartographie des fichiers

| Fichier | Action |
|---------|--------|
| `src/renderer/src/mock/vinDecoder.ts` | **Modifier** : reframe validation + grande table WMI + champ `source` |
| `src/renderer/src/mock/vinDecoder.test.ts` | **Modifier** : tests validation reformulée + nouvelles entrées WMI |
| `src/main/vinOnline.ts` | **Créer** : `mapNhtsaCategorie()` (pur) + `decoderVinEnLigne()` (fetch NHTSA) |
| `src/main/index.ts` | **Modifier** : handler IPC `vin:decodeOnline` |
| `src/preload/index.ts` | **Modifier** : `vinDecodeOnline` dans l'API |
| `src/renderer/src/api/electron.ts` | **Modifier** : wrapper `vinDecodeOnline` + types |
| `src/renderer/src/pages/DecodeurVinWindow.tsx` | **Modifier** : nouvelle validation, secours en ligne auto, badge source, cache, chargement, bouton en ligne activé |
| `tests/vinOnline.test.ts` | **Créer** : test du mapping NHTSA → catégorie |

---

## Conventions
- Type résultat unifié `ResultatVin` (local ET en ligne remplissent la même forme + `source: 'local' | 'en ligne'`).
- Catégories : `'Voiture' | 'Camion' | 'Autre'`. Confiance : `'élevée' | 'moyenne' | 'faible'`.
- Clé de cache en ligne : `tcit_vin_online_<VIN>` (localStorage).

---

# PHASE 1 — Local : validation reformulée + table WMI élargie (TDD)

### Tâche 1.1 : Réécrire `ResultatVin` + validation (TDD)

**Fichiers :** `src/renderer/src/mock/vinDecoder.ts`, `src/renderer/src/mock/vinDecoder.test.ts`

- [ ] **Étape 1 : Adapter les tests (échec attendu)** — remplacer les assertions `valide` par la validation
  reformulée dans `vinDecoder.test.ts` :
  ```ts
  import { describe, it, expect } from 'vitest'
  import { decoderVin } from './vinDecoder'

  describe('validation reformulée', () => {
    it('VIN nord-américain valide : structure OK + chiffre de contrôle OK/requis', () => {
      const r = decoderVin('1HGCM82633A004352') // Honda US, check digit valide
      expect(r.structureValide).toBe(true)
      expect(r.chiffreControleRequis).toBe(true)   // WMI commence par 1
      expect(r.chiffreControleOk).toBe(true)
      expect(r.source).toBe('local')
    })
    it('VIN hors NA (Europe) : structure OK, chiffre de contrôle NON requis même si non conforme', () => {
      const r = decoderVin('SB1EA56L60E0E0356') // Toyota UK
      expect(r.structureValide).toBe(true)
      expect(r.chiffreControleRequis).toBe(false)  // WMI commence par S
      expect(r.raisonInvalide).toBeNull()          // pas d'erreur bloquante
      expect(r.constructeur).toContain('Toyota')   // SB1 désormais reconnu
      expect(r.categorie).toBe('Voiture')
    })
    it('longueur incorrecte → structure invalide', () => {
      expect(decoderVin('TROPCOURT').structureValide).toBe(false)
    })
    it('caractère interdit I/O/Q → structure invalide', () => {
      expect(decoderVin('1HGCM8263IA004352').structureValide).toBe(false)
    })
    it('camion sûr (MAN WMA) → Camion élevée', () => {
      const r = decoderVin('WMA06XZZ7CM123456')
      expect(r.categorie).toBe('Camion'); expect(r.confiance).toBe('élevée')
    })
  })
  ```

- [ ] **Étape 2 : Lancer → échec** : `cd "/f/AI PROJECTS/STCA-Electron" && npx vitest run src/renderer/src/mock/vinDecoder.test.ts`

- [ ] **Étape 3 : Réécrire l'interface + la validation dans `vinDecoder.ts`**
  Remplacer l'interface `ResultatVin` par :
  ```ts
  export interface ResultatVin {
    vin: string
    source: 'local' | 'en ligne'
    structureValide: boolean          // 17 car., charset VIN, pas de I/O/Q
    raisonInvalide: string | null     // renseigné seulement si structure invalide
    chiffreControleRequis: boolean    // WMI nord-américain (1re lettre 1-5)
    chiffreControleOk: boolean        // le chiffre pos.9 correspond
    noteControle: string              // message secondaire (jamais bloquant)
    wmi: string
    constructeur: string
    pays: string
    annee: string
    usine: string
    serie: string
    categorie: Categorie | null
    confiance: Confiance
    raisonCategorie: string
  }
  ```
  Remplacer le corps de `decoderVin` (bloc validation) par :
  ```ts
  export function decoderVin(brut: string): ResultatVin {
    const vin = nettoyer(brut)
    const base: ResultatVin = {
      vin, source: 'local', structureValide: false, raisonInvalide: null,
      chiffreControleRequis: /^[1-5]/.test(vin), chiffreControleOk: false, noteControle: '',
      wmi: vin.slice(0, 3), constructeur: 'Inconnu', pays: '—', annee: '—',
      usine: vin[10] ?? '—', serie: vin.slice(11), categorie: null, confiance: 'faible', raisonCategorie: '',
    }

    // Validation de STRUCTURE (seule bloquante)
    if (vin.length !== 17) { base.raisonInvalide = `Longueur ${vin.length}/17 caractères`; return base }
    if (/[IOQ]/.test(vin)) { base.raisonInvalide = 'Contient un caractère interdit (I, O ou Q)'; return base }
    if (!/^[A-HJ-NPR-Z0-9]+$/.test(vin)) { base.raisonInvalide = 'Caractères non valides'; return base }
    base.structureValide = true

    // Chiffre de contrôle — informatif (obligatoire seulement en Amérique du Nord)
    const attendu = chiffreControle(vin)
    base.chiffreControleOk = vin[8] === attendu
    base.noteControle = base.chiffreControleOk
      ? 'Chiffre de contrôle conforme.'
      : base.chiffreControleRequis
        ? `Chiffre de contrôle incorrect (« ${vin[8]} » ≠ « ${attendu} ») — VIN nord-américain suspect.`
        : 'Chiffre de contrôle non applicable (VIN hors Amérique du Nord).'

    // Structure : constructeur / pays / année (inchangé)
    const info = trouverInfo(vin)
    if (info) { base.constructeur = info.constructeur; base.pays = info.pays }
    else { base.pays = REGIONS.find(([re]) => re.test(vin))?.[1] ?? '—' }
    base.annee = ANNEES[vin[9]] ? String(ANNEES[vin[9]]) : '—'

    // Catégorie suggérée (inchangé)
    if (info?.categorie) {
      base.categorie = info.categorie
      base.confiance = info.confiance ?? 'moyenne'
      base.raisonCategorie = base.confiance === 'élevée'
        ? `Constructeur ${info.constructeur} (WMI « ${vin.slice(0, 3)} »)`
        : `Basé sur le constructeur ${info.constructeur} — à confirmer`
    } else {
      base.raisonCategorie = info
        ? `Constructeur mixte (${info.constructeur}) — catégorie à confirmer par l'opérateur`
        : 'Constructeur non répertorié — catégorie à confirmer'
    }
    return base
  }
  ```

- [ ] **Étape 4 : Lancer → vert** (`npx vitest run src/renderer/src/mock/vinDecoder.test.ts`).

### Tâche 1.2 : Élargir la table WMI (autant que possible en local)

**Fichiers :** `src/renderer/src/mock/vinDecoder.ts`

- [ ] **Étape 1 : Remplacer `WMI_TABLE`** par la version élargie (curatée pour le parc transit ouest-africain :
  Europe/Japon/Corée + poids lourds). Préfixes longs prioritaires (Actros/Axor). Code EXACT :
  ```ts
  const WMI_TABLE: Record<string, InfoWmi> = {
    // ── POIDS LOURDS exclusifs → Camion (confiance élevée) ──
    WMA: { constructeur: 'MAN Truck & Bus', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
    XLR: { constructeur: 'DAF Trucks', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
    XLD: { constructeur: 'DAF Trucks', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
    YS2: { constructeur: 'Scania', pays: 'Suède', categorie: 'Camion', confiance: 'élevée' },
    XLE: { constructeur: 'Scania', pays: 'Pays-Bas', categorie: 'Camion', confiance: 'élevée' },
    YV2: { constructeur: 'Volvo Trucks', pays: 'Suède', categorie: 'Camion', confiance: 'élevée' },
    YB1: { constructeur: 'Volvo Trucks (Gand)', pays: 'Belgique', categorie: 'Camion', confiance: 'élevée' },
    VF6: { constructeur: 'Renault Trucks', pays: 'France', categorie: 'Camion', confiance: 'élevée' },
    ZCF: { constructeur: 'Iveco', pays: 'Italie', categorie: 'Camion', confiance: 'élevée' },
    WJM: { constructeur: 'Iveco', pays: 'Italie', categorie: 'Camion', confiance: 'élevée' },
    // Mercedes poids lourds (préfixes longs prioritaires)
    WDB963: { constructeur: 'Mercedes-Benz (Actros)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
    WDB934: { constructeur: 'Mercedes-Benz (Axor)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
    WDB930: { constructeur: 'Mercedes-Benz (Atego)', pays: 'Allemagne', categorie: 'Camion', confiance: 'élevée' },
    // ── MERCEDES (mixte, sinon à confirmer) ──
    WDB: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
    WDC: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
    WDD: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
    W1K: { constructeur: 'Mercedes-Benz', pays: 'Allemagne' },
    W1N: { constructeur: 'Mercedes-Benz (SUV)', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
    WDF: { constructeur: 'Mercedes-Benz (Sprinter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
    W1V: { constructeur: 'Mercedes-Benz (Sprinter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
    // ── TOYOTA (usines) ──
    JTD: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    JTN: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    JTM: { constructeur: 'Toyota (SUV)', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    JTE: { constructeur: 'Toyota (4x4)', pays: 'Japon' },
    JTF: { constructeur: 'Toyota (Hiace)', pays: 'Japon', categorie: 'Autre', confiance: 'moyenne' },
    JTG: { constructeur: 'Toyota (Coaster/bus)', pays: 'Japon', categorie: 'Autre', confiance: 'moyenne' },
    JTL: { constructeur: 'Toyota', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    SB1: { constructeur: 'Toyota (usine UK)', pays: 'Royaume-Uni', categorie: 'Voiture', confiance: 'moyenne' },
    VNK: { constructeur: 'Toyota (usine Turquie)', pays: 'Turquie', categorie: 'Voiture', confiance: 'moyenne' },
    NMT: { constructeur: 'Toyota (usine Turquie)', pays: 'Turquie', categorie: 'Voiture', confiance: 'moyenne' },
    MR0: { constructeur: 'Toyota (usine Thaïlande)', pays: 'Thaïlande' },
    MHF: { constructeur: 'Toyota (usine Indonésie)', pays: 'Indonésie' },
    AHT: { constructeur: 'Toyota (Hilux)', pays: 'Afrique du Sud', categorie: 'Camion', confiance: 'moyenne' },
    // ── LEXUS / DAIHATSU ──
    JTH: { constructeur: 'Lexus', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    // ── NISSAN ──
    JN1: { constructeur: 'Nissan', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    JN6: { constructeur: 'Nissan (utilitaire)', pays: 'Japon', categorie: 'Autre', confiance: 'moyenne' },
    VSK: { constructeur: 'Nissan (usine Espagne)', pays: 'Espagne' },
    VWA: { constructeur: 'Nissan (usine UK)', pays: 'Royaume-Uni', categorie: 'Voiture', confiance: 'moyenne' },
    // ── HONDA ──
    JHM: { constructeur: 'Honda', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    JHL: { constructeur: 'Honda (SUV)', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    SHH: { constructeur: 'Honda (usine UK)', pays: 'Royaume-Uni', categorie: 'Voiture', confiance: 'moyenne' },
    // ── CORÉE ──
    KMH: { constructeur: 'Hyundai', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
    KMF: { constructeur: 'Hyundai (utilitaire)', pays: 'Corée du Sud', categorie: 'Camion', confiance: 'moyenne' },
    TMA: { constructeur: 'Hyundai (usine Tchéquie)', pays: 'Tchéquie', categorie: 'Voiture', confiance: 'moyenne' },
    KNA: { constructeur: 'Kia', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
    KNB: { constructeur: 'Kia', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
    KND: { constructeur: 'Kia (SUV)', pays: 'Corée du Sud', categorie: 'Voiture', confiance: 'moyenne' },
    U5Y: { constructeur: 'Kia (usine Slovaquie)', pays: 'Slovaquie', categorie: 'Voiture', confiance: 'moyenne' },
    KL:  { constructeur: 'GM Korea / Daewoo', pays: 'Corée du Sud' },
    // ── FRANCE (PSA / Renault / Dacia) ──
    VF1: { constructeur: 'Renault', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
    VF7: { constructeur: 'Citroën', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
    VF3: { constructeur: 'Peugeot', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
    UU1: { constructeur: 'Dacia', pays: 'Roumanie', categorie: 'Voiture', confiance: 'moyenne' },
    VF8: { constructeur: 'Matra/DS', pays: 'France', categorie: 'Voiture', confiance: 'moyenne' },
    // ── VW GROUP ──
    WVW: { constructeur: 'Volkswagen', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
    WVG: { constructeur: 'Volkswagen (SUV)', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
    WV1: { constructeur: 'Volkswagen (utilitaire)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
    WV2: { constructeur: 'Volkswagen (Transporter)', pays: 'Allemagne', categorie: 'Autre', confiance: 'moyenne' },
    WAU: { constructeur: 'Audi', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
    TMB: { constructeur: 'Škoda', pays: 'Tchéquie', categorie: 'Voiture', confiance: 'moyenne' },
    VSS: { constructeur: 'SEAT', pays: 'Espagne', categorie: 'Voiture', confiance: 'moyenne' },
    // ── BMW ──
    WBA: { constructeur: 'BMW', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
    WBS: { constructeur: 'BMW M', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
    WBY: { constructeur: 'BMW i', pays: 'Allemagne', categorie: 'Voiture', confiance: 'moyenne' },
    // ── FORD ──
    WF0: { constructeur: 'Ford (Europe)', pays: 'Allemagne' },
    MAJ: { constructeur: 'Ford (usine Inde)', pays: 'Inde' },
    // ── FIAT ──
    ZFA: { constructeur: 'Fiat', pays: 'Italie', categorie: 'Voiture', confiance: 'moyenne' },
    ZFC: { constructeur: 'Fiat (utilitaire)', pays: 'Italie', categorie: 'Autre', confiance: 'moyenne' },
    // ── JAPON divers ──
    JMB: { constructeur: 'Mitsubishi', pays: 'Japon' },
    MMB: { constructeur: 'Mitsubishi', pays: 'Thaïlande' },
    MMT: { constructeur: 'Mitsubishi (Triton/pick-up)', pays: 'Thaïlande', categorie: 'Camion', confiance: 'moyenne' },
    MPA: { constructeur: 'Isuzu (D-Max)', pays: 'Thaïlande', categorie: 'Camion', confiance: 'moyenne' },
    MP1: { constructeur: 'Isuzu (D-Max)', pays: 'Thaïlande', categorie: 'Camion', confiance: 'moyenne' },
    JAL: { constructeur: 'Isuzu (camion)', pays: 'Japon', categorie: 'Camion', confiance: 'moyenne' },
    JAA: { constructeur: 'Isuzu (camion)', pays: 'Japon', categorie: 'Camion', confiance: 'moyenne' },
    JS3: { constructeur: 'Suzuki', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    JM1: { constructeur: 'Mazda', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    JF1: { constructeur: 'Subaru', pays: 'Japon', categorie: 'Voiture', confiance: 'moyenne' },
    // ── HINO / camions japonais ──
    JHD: { constructeur: 'Hino (camion)', pays: 'Japon', categorie: 'Camion', confiance: 'élevée' },
  }
  ```
  (La couverture reste indicative ; l'exhaustivité est déléguée au secours en ligne — Phase 2.)

- [ ] **Étape 2 :** `npx vitest run src/renderer/src/mock/vinDecoder.test.ts` → vert. **Étape 3 : commit**
  `git add -A && git commit -m "feat(vin): validation reformulée (structure ≠ chiffre de contrôle) + table WMI élargie"`

---

# PHASE 2 — En ligne : module NHTSA (main) + IPC (TDD sur le mapping)

### Tâche 2.1 : `src/main/vinOnline.ts` — mapping (TDD) + fetch

- [ ] **Étape 1 : Test du mapping `tests/vinOnline.test.ts`**
  ```ts
  import { describe, it, expect } from 'vitest'
  import { mapNhtsaCategorie } from '../src/main/vinOnline'
  describe('mapNhtsaCategorie', () => {
    it('PASSENGER CAR → Voiture', () => expect(mapNhtsaCategorie('PASSENGER CAR', '')).toBe('Voiture'))
    it('TRUCK → Camion', () => expect(mapNhtsaCategorie('TRUCK', '')).toBe('Camion'))
    it('MPV → Voiture', () => expect(mapNhtsaCategorie('MULTIPURPOSE PASSENGER VEHICLE (MPV)', '')).toBe('Voiture'))
    it('BUS → Autre', () => expect(mapNhtsaCategorie('BUS', '')).toBe('Autre'))
    it('vide + BodyClass Pickup → Camion', () => expect(mapNhtsaCategorie('', 'Pickup')).toBe('Camion'))
    it('inconnu total → null', () => expect(mapNhtsaCategorie('', '')).toBeNull())
  })
  ```

- [ ] **Étape 2 : Lancer → échec** (`cd "/f/AI PROJECTS/STCA-Electron" && npx vitest run tests/vinOnline.test.ts`).

- [ ] **Étape 3 : Écrire `src/main/vinOnline.ts`**
  ```ts
  // Décodage VIN EN LIGNE via NHTSA vPIC (US DOT, gratuit, sans clé). Exécuté côté MAIN
  // (la CSP renderer interdit le réseau externe). fetch global (Node 18 / Electron 28).
  export type CategorieVin = 'Voiture' | 'Camion' | 'Autre'

  export interface ResultatVinEnLigne {
    ok: boolean
    erreur?: string
    constructeur: string
    pays: string
    annee: string
    marque: string
    modele: string
    typeVehicule: string
    categorie: CategorieVin | null
  }

  /** Mappe le VehicleType / BodyClass NHTSA vers nos catégories. */
  export function mapNhtsaCategorie(vehicleType: string, bodyClass: string): CategorieVin | null {
    const vt = (vehicleType || '').toUpperCase()
    const bc = (bodyClass || '').toUpperCase()
    if (vt.includes('TRUCK') || bc.includes('PICKUP') || bc.includes('TRACTOR') || bc.includes('CAB')) return 'Camion'
    if (vt.includes('BUS') || vt.includes('MOTORCYCLE') || vt.includes('TRAILER') || bc.includes('VAN') || bc.includes('BUS')) return 'Autre'
    if (vt.includes('PASSENGER') || vt.includes('MPV') || vt.includes('MULTIPURPOSE')) return 'Voiture'
    if (bc.includes('SUV') || bc.includes('SEDAN') || bc.includes('HATCHBACK') || bc.includes('WAGON') || bc.includes('COUPE')) return 'Voiture'
    if (bc.includes('PICKUP')) return 'Camion'
    return null
  }

  const champ = (arr: Array<{ Variable: string; Value: string | null }>, nom: string): string =>
    (arr.find(x => x.Variable === nom)?.Value ?? '').trim()

  /** Interroge NHTSA vPIC (timeout 6 s). Retourne un résultat mappé, ou ok:false. */
  export async function decoderVinEnLigne(vin: string): Promise<ResultatVinEnLigne> {
    const vide: ResultatVinEnLigne = { ok: false, constructeur: 'Inconnu', pays: '—', annee: '—', marque: '', modele: '', typeVehicule: '', categorie: null }
    const url = `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${encodeURIComponent(vin)}?format=json`
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 6000)
    try {
      const r = await fetch(url, { signal: ctrl.signal })
      if (!r.ok) return { ...vide, erreur: `HTTP ${r.status}` }
      const j = await r.json() as { Results: Array<{ Variable: string; Value: string | null }> }
      const res = j.Results ?? []
      const make = champ(res, 'Make')
      const manuf = champ(res, 'Manufacturer Name')
      const annee = champ(res, 'Model Year')
      const type = champ(res, 'Vehicle Type')
      const body = champ(res, 'Body Class')
      const modele = champ(res, 'Model')
      const errCode = champ(res, 'Error Code')
      const ok = (make !== '' || manuf !== '') && errCode !== '11' // 11 = VIN inconnu de la base
      return {
        ok,
        constructeur: make || manuf || 'Inconnu',
        pays: champ(res, 'Plant Country') || '—',
        annee: annee || '—',
        marque: make, modele,
        typeVehicule: type || body || '',
        categorie: mapNhtsaCategorie(type, body),
        erreur: ok ? undefined : 'VIN non reconnu par NHTSA',
      }
    } catch (e) {
      return { ...vide, erreur: e instanceof Error && e.name === 'AbortError' ? 'Délai dépassé' : 'Réseau indisponible' }
    } finally {
      clearTimeout(t)
    }
  }
  ```

- [ ] **Étape 4 : Lancer → vert** (`npx vitest run tests/vinOnline.test.ts`).

### Tâche 2.2 : Brancher IPC + preload + electronApi

- [ ] **Étape 1 : `src/main/index.ts`** — importer et enregistrer le handler (à côté des autres `ipcMain.handle`,
  ex. juste après le bloc `import:*` repéré vers la ligne 293) :
  ```ts
  import { decoderVinEnLigne } from './vinOnline'
  // …dans app.whenReady() / la zone des handlers :
  ipcMain.handle('vin:decodeOnline', (_e, vin: string) => decoderVinEnLigne(vin))
  ```
  (Repérer la zone : `grep -n "ipcMain.handle('import:run'" src/main/index.ts`.)

- [ ] **Étape 2 : `src/preload/index.ts`** — ajouter dans l'objet `api` (avant la fermeture `}`) :
  ```ts
  // Décodage VIN en ligne (NHTSA, exécuté côté main)
  vinDecodeOnline: (vin: string): Promise<{
    ok: boolean; erreur?: string; constructeur: string; pays: string; annee: string;
    marque: string; modele: string; typeVehicule: string; categorie: 'Voiture'|'Camion'|'Autre'|null
  }> => ipcRenderer.invoke('vin:decodeOnline', vin),
  ```

- [ ] **Étape 3 : `src/renderer/src/api/electron.ts`** — exposer via `electronApi`. Repérer la déclaration
  (`grep -n "electronApi" src/renderer/src/api/electron.ts`) et ajouter, en suivant le même style que
  `mdiOpen`/`printersList`, une méthode `vinDecodeOnline(vin: string)` déléguant à `window.api.vinDecodeOnline(vin)`
  (avec le type de retour ci-dessus, exporté comme interface `VinEnLigne`).

- [ ] **Étape 4 : Typecheck** `npm run typecheck` → 0 erreur. **Commit** :
  `git commit -am "feat(vin): décodage en ligne NHTSA côté main + IPC vin:decodeOnline"`

---

# PHASE 3 — UI : `DecodeurVinWindow` (validation, secours auto, badge, cache, chargement)

### Tâche 3.1 : Nouvelle présentation de validation + secours en ligne

**Fichier :** `src/renderer/src/pages/DecodeurVinWindow.tsx`

- [ ] **Étape 1 : État + logique.** Remplacer le haut du composant (états + `decoder`) par :
  ```ts
  const [vin, setVin] = useState(() => { try { return (localStorage.getItem('tcit_vin_decode') ?? '').toUpperCase() } catch { return '' } })
  const [res, setRes] = useState<ResultatVin | null>(null)
  const [chargement, setChargement] = useState(false)   // appel en ligne en cours
  const [enLigneEssaye, setEnLigneEssaye] = useState(false)

  // Décode en local, puis bascule en ligne si nécessaire ET connecté.
  const decoder = async (forcerEnLigne = false): Promise<void> => {
    const local = decoderVin(vin)
    setRes(local); setEnLigneEssaye(false)
    if (!local.structureValide) return
    const insuffisant = local.categorie === null || local.constructeur === 'Inconnu'
    if (!forcerEnLigne && !insuffisant) return
    if (!navigator.onLine) return                        // hors ligne : on garde le local
    // cache
    const cle = 'tcit_vin_online_' + local.vin
    try { const c = localStorage.getItem(cle); if (c) { appliquerEnLigne(local, JSON.parse(c)); return } } catch { /* ignore */ }
    setChargement(true); setEnLigneEssaye(true)
    try {
      const online = await window.api.vinDecodeOnline(local.vin)
      if (online.ok) { try { localStorage.setItem(cle, JSON.stringify(online)) } catch { /* ignore */ }; appliquerEnLigne(local, online) }
    } catch { /* ignore : on garde le local */ } finally { setChargement(false) }
  }

  function appliquerEnLigne(local: ResultatVin, o: { constructeur: string; pays: string; annee: string; typeVehicule: string; categorie: Categorie | null }): void {
    setRes({
      ...local, source: 'en ligne',
      constructeur: o.constructeur || local.constructeur,
      pays: o.pays !== '—' ? o.pays : local.pays,
      annee: o.annee !== '—' ? o.annee : local.annee,
      categorie: o.categorie ?? local.categorie,
      confiance: o.categorie ? 'élevée' : local.confiance,
      raisonCategorie: o.categorie ? `NHTSA — ${o.typeVehicule || 'type identifié'}` : local.raisonCategorie,
    })
  }
  ```
  Adapter l'`useEffect` d'auto-décodage au montage : `useEffect(() => { if (vin.length === 17) void decoder() }, [])`.

- [ ] **Étape 2 : Bloc validation (remplacer le « ✓/✗ » actuel)** par la structure + note secondaire :
  ```tsx
  <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, marginBottom: 6, color: res.structureValide ? C.green : C.red }}>
    {res.structureValide ? '✓ Structure VIN valide (17 caractères)' : `✗ ${res.raisonInvalide}`}
  </div>
  {res.structureValide && (
    <div style={{ fontSize: 10.5, color: res.chiffreControleOk ? C.green : (res.chiffreControleRequis ? C.gold : C.muted), marginBottom: 10 }}>
      {res.chiffreControleOk ? '● ' : (res.chiffreControleRequis ? '⚠ ' : 'ℹ ')}{res.noteControle}
    </div>
  )}
  ```

- [ ] **Étape 3 : Badge de source + chargement** — dans l'entête du bloc « Résultat », afficher :
  ```tsx
  <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 10,
    background: res.source === 'en ligne' ? '#EFF6FF' : '#F1F5F9', color: res.source === 'en ligne' ? C.accent : C.muted }}>
    {res.source === 'en ligne' ? '🌐 Source : NHTSA en ligne' : '💾 Source : base hors ligne'}
  </span>
  ```
  Et un indicateur pendant l'appel : si `chargement`, afficher sous le résultat
  `<div style={{ fontSize: 11, color: C.accent }}>⏳ Recherche en ligne (NHTSA)…</div>`.

- [ ] **Étape 4 : Activer le bouton « Décoder en ligne (NHTSA) »** (aujourd'hui `disabled`) :
  ```tsx
  <button style={{ ...btn, background: '#fff', border: `1px solid ${C.accent}`, color: C.accent }}
    disabled={chargement || vin.length !== 17} onClick={() => void decoder(true)}
    title={navigator.onLine ? 'Forcer le décodage en ligne' : 'Aucune connexion Internet détectée'}>
    🌐 Décoder en ligne (NHTSA)
  </button>
  ```
  Et si hors ligne, afficher une petite note à côté : `!navigator.onLine && <span style={{fontSize:10.5,color:C.muted}}>Hors ligne — décodage local seul.</span>`.
  Le bouton « 🔍 Décoder » appelle désormais `() => void decoder()`.

- [ ] **Étape 5 : Typecheck** `npm run typecheck` → 0 erreur. **Commit** :
  `git commit -am "feat(vin): fenêtre — validation structure, secours en ligne auto, badge source + cache"`

---

# PHASE 4 — Vérification E2E (visible)

### Tâche 4.1 : Test réel dans l'app

- [ ] **Étape 1 :** `npm run dev` (fenêtre visible). Se connecter, ouvrir Enregistrement.
- [ ] **Étape 2 — local reconnu :** châssis `SB1EA56L60E0E0356` → « Décoder » → **Structure valide** (vert),
  note « chiffre de contrôle non applicable », **Toyota / Voiture** (source hors ligne). Plus de « ✗ » rouge.
- [ ] **Étape 3 — camion sûr :** `WMA06XZZ7CM123456` → MAN / **Camion** (élevée).
- [ ] **Étape 4 — secours en ligne :** un VIN d'un constructeur hors table (ex. un VIN US réel) avec PC **connecté**
  → bascule auto NHTSA, badge « 🌐 Source : NHTSA en ligne », type rempli. Puis **couper le réseau** → même VIN
  → reste en local « à confirmer » sans planter.
- [ ] **Étape 5 — Appliquer :** « ✓ Appliquer ce type » renseigne « Véhicule à assurer » dans le formulaire
  (signal `tcit_vin_type` inchangé).
- [ ] **Étape 6 : Commit final + doc session** `docs/session-2026-07-30-decodeur-vin.md`, puis push.

---

## Auto-évaluation
1. **Couverture :** validation reformulée (P1.1), table élargie dont `SB1` (P1.2), en ligne NHTSA + IPC (P2),
   flux local→en ligne auto + connectivité + cache + badge + bouton activé (P3), E2E (P4). ✅
2. **Placeholders :** aucun ; code exact fourni (validation, table, mapping, fetch, IPC/preload, UI). Les 2 points
   d'adaptation (zone d'insertion IPC dans `index.ts`, forme exacte d'`electronApi`) sont repérés par `grep`. ✅
3. **Cohérence :** `ResultatVin` unifié (source local/en ligne), noms stables (`decoderVin`, `decoderVinEnLigne`,
   `mapNhtsaCategorie`, `vin:decodeOnline`, `vinDecodeOnline`). ✅

## Ordre d'exécution
P1 (gain immédiat visible hors ligne) → P2 (module en ligne) → P3 (UI + orchestration) → P4 (E2E).
