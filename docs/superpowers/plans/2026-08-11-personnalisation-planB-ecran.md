# Plan d'Implémentation : Personnalisation — Plan B (Écran ⚙️ + bouton sidebar)

**Objectif :** Ajouter la fenêtre MDI « Personnalisation » (3 onglets Identité / Apparence / Documents +
aperçu live) et le bouton ⚙️ en bas du sidebar qui l'ouvre, avec écriture de `branding.json` via
`electronApi.brandingEcrire` (mise à jour live de toute l'app grâce au Plan A).

**Architecture :** Nouvelle entrée `personnalisation` dans `WINDOW_REGISTRY` + `case` dans
`renderWindowContent` → composant `PersonnalisationWindow.tsx`. Le composant tient un **brouillon**
(`BrandingConfig`) initialisé depuis `electronApi.brandingCourant()` ; « Appliquer » écrit le fichier
(→ `branding:maj` → toute l'app se met à jour via `useBranding` du Plan A). L'aperçu est **scopé au
panneau** (ne modifie pas `<html>` avant Appliquer). Le bouton ⚙️ est une prop dédiée de `NavSidebar`.

**Stack :** React 18 · Ant Design 5 · TypeScript. Dépend du **Plan A** (déjà livré : `electronApi.branding*`,
`BrandingConfig`, `useBranding`, `construireAntdTheme`, `resoudreTheme`, `prefereSombreOS`).

**Spec visuelle EXACTE :** `prototype-html/personnalisation-propositions.html` (maquette validée). Le
composant reproduit **fidèlement** le panneau split (réglages | aperçu) — SANS la barre de titre ni le
menu/statut de la maquette (fournis par `MdiWindowHost`). Règle « copie fidèle » : reprendre les mêmes
valeurs de style (couleurs, tailles, radius) que le prototype.

---

## Cartographie des fichiers

| Action | Fichier | Rôle |
|---|---|---|
| Créer | `src/renderer/src/pages/PersonnalisationWindow.tsx` | Le composant (3 onglets + aperçu, câblé branding) |
| Modifier | `src/renderer/src/windows/WINDOW_REGISTRY.ts` | Entrée `personnalisation` |
| Modifier | `src/renderer/src/windows/WindowContent.tsx` | `case 'personnalisation'` |
| Modifier | `src/renderer/src/components/shell/NavSidebar.tsx` | Bouton ⚙️ en bas (prop `onOpenParametres`) |
| Modifier | `src/renderer/src/windows/MainScreen.tsx` | Passe `onOpenParametres={() => openById('personnalisation')}` |

---

## Tâche B1 : Enregistrer la fenêtre

**Fichier :** Modifier `src/renderer/src/windows/WINDOW_REGISTRY.ts`

- [ ] **Étape 1** — Ajouter, dans l'objet `WINDOW_REGISTRY` (par ex. juste après la ligne
  `rechercheChassis`), l'entrée :
  ```ts
  personnalisation:         { title: "Personnalisation de l'application",                 defaultX: 160, defaultY:  90, width: 1040, height: 680 },
  ```
- [ ] **Étape 2** — `npx tsc --noEmit -p tsconfig.web.json` → 0 erreur.
- [ ] **Étape 3** — Commit : `git add src/renderer/src/windows/WINDOW_REGISTRY.ts && git commit -m "feat(perso): fenêtre personnalisation dans WINDOW_REGISTRY"`

---

## Tâche B2 : Composant `PersonnalisationWindow`

**Fichier :** Créer `src/renderer/src/pages/PersonnalisationWindow.tsx`

> Reproduis **fidèlement** le panneau split de `prototype-html/personnalisation-propositions.html`
> (colonne réglages à onglets + colonne aperçu Connexion/Application/Document), en portant les styles
> inline. Le contrat d'état et TOUS les handlers ci-dessous sont impératifs (code exact).

- [ ] **Étape 1 — Squelette + état (brouillon)**
  ```tsx
  import { useEffect, useState, type CSSProperties } from 'react'
  import { electronApi } from '@api/electron'
  import { fusionnerBranding, resoudreTheme, type BrandingConfig, type ThemeChoix } from '../../../shared/branding'
  import { prefereSombreOS } from '@theme/appliquerBranding'

  type Onglet = 'identite' | 'apparence' | 'documents'
  type VueApercu = 'login' | 'app' | 'doc'
  const PRESETS = ['#2563EB', '#10B981', '#7C3AED', '#F59E0B', '#DC2626', '#0891B2'] as const

  export default function PersonnalisationWindow(): JSX.Element {
    const [draft, setDraft] = useState<BrandingConfig>(() => fusionnerBranding({}))
    const [onglet, setOnglet] = useState<Onglet>('identite')
    const [vue, setVue] = useState<VueApercu>('login')
    const [toast, setToast] = useState(false)

    useEffect(() => { electronApi.brandingCourant().then(setDraft) }, [])

    // Mises à jour immuables du brouillon
    const majIdentite = (p: Partial<BrandingConfig['identite']>): void =>
      setDraft(d => ({ ...d, identite: { ...d.identite, ...p } }))
    const majCoord = (p: Partial<BrandingConfig['identite']['coordonnees']>): void =>
      setDraft(d => ({ ...d, identite: { ...d.identite, coordonnees: { ...d.identite.coordonnees, ...p } } }))
    const majApparence = (p: Partial<BrandingConfig['apparence']>): void =>
      setDraft(d => ({ ...d, apparence: { ...d.apparence, ...p } }))
    const majDocuments = (p: Partial<BrandingConfig['documents']>): void =>
      setDraft(d => ({ ...d, documents: { ...d.documents, ...p } }))

    const onLogo = (file: File | undefined): void => {
      if (!file) return
      const r = new FileReader()
      r.onload = e => majIdentite({ logo: String(e.target?.result ?? '') })
      r.readAsDataURL(file)
    }

    const appliquer = (): void => {
      void electronApi.brandingEcrire(draft).then(() => { setToast(true); setTimeout(() => setToast(false), 1800) })
    }
    const reinitialiser = (): void => setDraft(fusionnerBranding({})) // défauts TCIT (persistés seulement à Appliquer)

    // Aperçu scopé au panneau (ne touche PAS <html> avant Appliquer)
    const apercuSombre = resoudreTheme(draft.apparence.theme, prefereSombreOS()) === 'sombre'
    const accent = draft.apparence.couleurAccent

    return (/* … JSX ci-dessous … */) as JSX.Element
  }
  ```

- [ ] **Étape 2 — Liaisons champ ↔ état (impératif)** — chaque champ de la maquette pilote exactement :
  | Champ maquette | Handler |
  |---|---|
  | Nom / raison sociale | `majIdentite({ nom })` |
  | Sigle | `majIdentite({ sigle })` |
  | Slogan | `majIdentite({ slogan })` |
  | Logo (drag/clic) | `onLogo(file)` |
  | Adresse / Téléphone / E-mail / NIF / RCCM | `majCoord({ adresse | tel | email | nif | rccm })` |
  | Thème (Clair/Sombre/Auto) | `majApparence({ theme })` avec `theme: ThemeChoix` = `'clair' | 'sombre' | 'auto'` |
  | Presets + couleur libre | `majApparence({ couleurAccent })` |
  | Ligne d'en-tête | `majDocuments({ enTete })` |
  | Mentions légales | `majDocuments({ mentionsLegales })` |
  | N° d'agrément | `majDocuments({ numeroAgrement })` |
  | Devise | `majDocuments({ devise })` |
  | Coordonnées bancaires | `majDocuments({ coordonneesBancaires })` |

- [ ] **Étape 3 — JSX (reproduction fidèle de la maquette)** — structure :
  - Racine `display:flex; flexDirection:column; height:100%` (le contenu s'insère dans `MdiWindowHost`, qui fournit déjà la barre de titre).
  - **Split** `display:grid; gridTemplateColumns: minmax(340px,1fr) minmax(340px,1.05fr)` (reprendre la maquette).
  - **Colonne réglages** : onglets (`onglet`/`setOnglet`) + les 3 panneaux (rendus selon `onglet`). Reprendre les styles `.tab/.sec/.fld/.inp/.seg/.swatches` de la maquette.
  - **Colonne aperçu** : segment `vue`/`setVue` + 3 aperçus. **Le conteneur de l'aperçu applique les couleurs du brouillon en inline** : par ex. un objet `styleApercu: CSSProperties` qui pose `['--accent' as any]: accent` et, si `apercuSombre`, les fonds/texte sombres (`#111826`, `#E9EEF6`, canvas `#05080D`) — SINON les couleurs claires. Aucune écriture sur `document.documentElement`.
  - **Aperçu Application** : inclure le mini-sidebar AVEC le bouton ⚙️ en bas (cohérent avec la vraie sidebar).
  - **Pied** : bouton `Réinitialiser` (→ `reinitialiser`) + `Appliquer` (→ `appliquer`). Le libellé partagé (« Ces réglages sont partagés par les 3 apps ») peut être conservé.
  - **Toast** : afficher « ✓ Personnalisation appliquée » quand `toast === true`.
  - Le logo par défaut (si `draft.identite.logo` est `null`) = l'étoile TCIT (SVG) teintée `var(--accent)` ; sinon `<img src={draft.identite.logo}>`.

- [ ] **Étape 4 — Vérifs**
  - `npx tsc --noEmit -p tsconfig.web.json` → 0 erreur (attention : `['--accent' as any]` ou un cast pour la CSS var).
  - `npx vitest run` → aucun NOUVEL échec (les 5 `MenuBar`/`MainScreen` restent pré-existants).
- [ ] **Étape 5 — Commit** : `git add src/renderer/src/pages/PersonnalisationWindow.tsx && git commit -m "feat(perso): fenêtre Personnalisation (3 onglets + aperçu live, câblée branding)"`

---

## Tâche B3 : Brancher le contenu

**Fichier :** Modifier `src/renderer/src/windows/WindowContent.tsx`

- [ ] **Étape 1** — Import en tête : `import PersonnalisationWindow from '@pages/PersonnalisationWindow'`
- [ ] **Étape 2** — Ajouter un `case` (par ex. dans la section « Menu Outils ») :
  ```tsx
      case 'personnalisation':
        return <PersonnalisationWindow />
  ```
- [ ] **Étape 3** — `npx tsc --noEmit -p tsconfig.web.json` → 0 erreur.
- [ ] **Étape 4** — Commit : `git add src/renderer/src/windows/WindowContent.tsx && git commit -m "feat(perso): mapping id personnalisation → composant"`

---

## Tâche B4 : Bouton ⚙️ dans le sidebar + câblage

**Fichiers :** Modifier `src/renderer/src/components/shell/NavSidebar.tsx`, `src/renderer/src/windows/MainScreen.tsx`

- [ ] **Étape 1 — `NavSidebar.tsx`** : ajouter une prop optionnelle et un bouton ⚙️ **poussé en bas**.
  - Dans `interface NavSidebarProps`, ajouter : `onOpenParametres?: () => void`
  - Signature : `export default function NavSidebar({ onSelect, activeId, onOpenParametres }: NavSidebarProps)`
  - Le conteneur racine du sidebar utilise déjà `flexDirection:'column'` ; après le `map` des `SIDEBAR_ITEMS`, ajouter le bouton en bas :
  ```tsx
  {onOpenParametres && (
    <button
      aria-label="Paramètres de l'application"
      className="nav-btn"
      onClick={onOpenParametres}
      style={{
        position: 'relative', width: 88, padding: '10px 4px', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 4, cursor: 'pointer', border: 'none', background: 'none',
        color: 'rgba(255,255,255,0.6)', borderRadius: 8, transition: 'all 0.2s',
        margin: '1px 0', marginTop: 'auto', flexShrink: 0,   // ← marginTop:auto = pousse en bas
      }}
      onMouseEnter={e => { const b = e.currentTarget; b.style.background = 'rgba(255,255,255,0.08)'; b.style.color = 'rgba(255,255,255,0.9)' }}
      onMouseLeave={e => { const b = e.currentTarget; b.style.background = 'none'; b.style.color = 'rgba(255,255,255,0.6)' }}
    >
      <span className="nav-ico" style={{ fontSize: 18 }}>⚙️</span>
      <span style={{ fontSize: 9.5, fontWeight: 500, textAlign: 'center', lineHeight: 1.2 }}>Paramètres</span>
    </button>
  )}
  ```
  (Reprend EXACTEMENT le style des boutons existants — cf. le `<button className="nav-btn">` du `map`.)
- [ ] **Étape 2 — `MainScreen.tsx`** : passer le handler. Remplacer
  `<NavSidebar onSelect={handleSidebarSelect} activeId={undefined} />` par
  `<NavSidebar onSelect={handleSidebarSelect} activeId={undefined} onOpenParametres={() => openById('personnalisation')} />`
- [ ] **Étape 3** — `npx tsc --noEmit -p tsconfig.web.json` → 0 erreur ; `npx vitest run` → pas de nouvel échec.
- [ ] **Étape 4** — Commit : `git add src/renderer/src/components/shell/NavSidebar.tsx src/renderer/src/windows/MainScreen.tsx && git commit -m "feat(perso): bouton ⚙️ Paramètres en bas du sidebar → ouvre la fenêtre"`

---

## Tâche B5 : Vérification (superviseur)

- [ ] Lancer l'app (`unset ELECTRON_RUN_AS_NODE; npx electron-vite dev -- --remote-debugging-port=9222`), se connecter.
- [ ] Cliquer ⚙️ en bas du sidebar → la fenêtre Personnalisation s'ouvre (3 onglets + aperçu).
- [ ] Changer nom/logo/couleur/thème → l'aperçu réagit ; « Appliquer » → l'app se met à jour live (accent, et thème si sombre) SANS redémarrage ; « Réinitialiser » → défauts TCIT.
- [ ] Confirmer que le **mode clair reste intact** par défaut.

## Auto-évaluation
1. **Couverture** — registre, composant (contrat d'état + tous handlers), mapping, bouton ⚙️ + câblage, vérif : tout est couvert.
2. **Placeholders** — la logique (état, handlers, intégration) est fournie en code exact ; le visuel renvoie à la maquette validée (règle « copie fidèle »), artefact concret committé.
3. **Cohérence** — `draft`, `majIdentite/majCoord/majApparence/majDocuments`, `onLogo`, `appliquer`, `reinitialiser`, id `personnalisation`, prop `onOpenParametres` : noms identiques partout.

## Dépendances / suites
- Dépend du **Plan A** (livré). Le **Plan A-bis** (recoloration coquille) reste à faire pour que le sombre soit visuellement complet dans TOUTE l'app (la fenêtre Personnalisation, elle, gère son aperçu en interne).
- **Plan C** (tcit-ui + Affichage + Pointage) ensuite.
