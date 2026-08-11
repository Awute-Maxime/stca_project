# Conception — Personnalisation de la suite TCIT + Mode sombre (V1)

**Objectif :** Rendre la suite TCIT personnalisable par client (logo, nom, coordonnées, couleurs,
documents imprimés) et ajouter un **mode sombre**, le tout **partagé par les 3 apps** (TCIT ·
Affichage · Pointage) via une source unique.

**Architecture :** Un fichier de configuration partagé `%PROGRAMDATA%\TCIT\branding.json` (même
principe que `stca-m.json`), lu par le paquet commun `tcit-ui` et par les 3 apps. Un
`BrandingProvider` pose des variables CSS + un attribut `data-theme` ; l'app principale (Ant Design 5)
ajoute l'algorithme sombre. Rafraîchissement live à l'enregistrement.

**Stack :** Electron 28 · React 18 · Ant Design 5 (app principale) · TypeScript · paquet `tcit-ui`
(dépendance `file:` des 3 apps).

---

## 1. Périmètre V1 & contrainte capitale

**Dans le périmètre :** (1) Mode sombre · (2) Identité / marque · (3) Documents imprimés.

**⚠️ CONTRAINTE CAPITALE — le mode CLAIR = l'application ACTUELLE, strictement inchangée.**
On ne modifie **aucune** couleur du système visuel existant. Le mode sombre est **purement additif** :
il n'est actif que si l'utilisateur choisit « Sombre » (ou « Auto » + OS sombre). Par défaut, tout
reste exactement comme aujourd'hui. Le thème clair est défini par l'existant, pas re-spécifié ici.

**Hors périmètre (→ V2) :** Métier (tarifs, TVA, numérotation), Système (sauvegarde auto, export,
déconnexion auto). Voir [[project-stca-revue-checklist]].

---

## 2. Architecture — source unique partagée

- Nouveau helper `src/shared/cheminBranding.ts` (dupliqué à l'identique dans les 3 apps + `tcit-ui`,
  comme `cheminBaseM.ts`) :
  ```ts
  export function cheminBranding(): string {
    const racine = process.env.PROGRAMDATA || join(homedir(), '.tcit')
    return join(racine, 'TCIT', 'branding.json')
  }
  ```
- **Écriture** : seule l'app principale TCIT écrit `branding.json` (écran Personnalisation).
- **Lecture / application (décidé : « fichier partagé, appliqué localement »)** : chaque app lit le
  fichier et l'applique avec **ses propres tokens**. L'app principale **n'utilise pas `tcit-ui`** → elle
  a son **propre** module branding (`src/shared/branding.ts`, `src/main/brandingStore.ts`, applieur).
  `tcit-ui` fournit le loader/provider pour **Affichage + Pointage** (Plan C). Seul le **fichier**
  `branding.json` est partagé, pas le code. Découpage : **Plan A** (fondation TCIT), **A-bis**
  (recoloration composants), **B** (écran + bouton ⚙️), **C** (Affichage/Pointage).
- **Absence de fichier** → valeurs par défaut TCIT (identité TCIT actuelle, thème clair). Jamais d'erreur.

---

## 3. Modèle de données — `branding.json`

```jsonc
{
  "version": 1,
  "identite": {
    "nom": "TCIT — Togolaise de Contrôle et d'Immatriculation Transit",
    "sigle": "TCIT",
    "slogan": "Contrôle · Immatriculation · Transit",
    "logo": "data:image/png;base64,…",          // null → étoile TCIT par défaut
    "coordonnees": { "adresse": "", "tel": "", "email": "", "siteWeb": "", "nif": "", "rccm": "" }
  },
  "apparence": {
    "theme": "clair",                             // "clair" | "sombre" | "auto"  (défaut "clair")
    "couleurAccent": "#2563EB"                    // presets + couleur libre ; défaut bleu TCIT
  },
  "documents": {
    "logo": "data:image/png;base64,…",            // null → réutilise identite.logo
    "cachet": "data:image/png;base64,…",
    "enTete": "", "piedDePage": "", "mentionsLegales": "",
    "numeroAgrement": "", "devise": "FCFA", "coordonneesBancaires": ""
  }
}
```

---

## 4. Chargement & propagation (`tcit-ui`)

- `tcit-ui/branding` : `chargerBranding()` (lecture fichier + fusion défauts) et `<BrandingProvider>`
  React qui :
  - pose sur `<html>` : `data-theme` (résolu depuis `apparence.theme`, « auto » via
    `matchMedia('(prefers-color-scheme: dark)')`) et la variable CSS `--tcit-accent` = `couleurAccent` ;
  - expose par contexte : `logo`, `nom`, `sigle`, `coordonnees`, `documents`.
- **Variables CSS** : le mode sombre est un bloc `:root[data-theme="dark"]{ … }` qui **surcharge**
  uniquement les tokens de surface/texte/chrome. Le clair reste les valeurs actuelles (aucune touchée).
- **App principale (AntD 5)** : `<ConfigProvider theme={{ algorithm: sombre ? [darkAlgorithm] : [defaultAlgorithm], token: { colorPrimary: accent } }}>`.
- **Affichage / Pointage** : consomment les mêmes variables CSS via `tcit-ui` (déjà en place).

---

## 5. Thèmes

**Clair** = l'existant, inchangé (navy `#1B3A6B`, accent `#2563EB`, gold IMMAT `#F59E0B`, fonds blancs…).

**Sombre** (nouveau) — canvas noir profond « lumineux » (l'accent rayonne). Tokens de référence
(validés en maquette `prototype-html/personnalisation-propositions.html`) :
| Rôle | Sombre |
|---|---|
| Bureau / fond | `#05080D` |
| Surface / fenêtre | `#111826` |
| Chrome (titre/sidebar/statut) | `#0E1626 → #0A1018` |
| Texte / atténué | `#E9EEF6` / `#93A1B5` |
| Bordures | `rgba(255,255,255,.08)` |
| Accent (défaut) | **bleu TCIT `#2563EB`** + glow |
| Accent (preset) | **émeraude `#10B981`** (glow `#2FE0A0`) — inspiré capture utilisateur, couleurs seules |

**Presets d'accent** : Bleu TCIT (défaut), Émeraude, Violet, Ambre, Rouge, Cyan + couleur libre.
Le fond sombre ne change pas selon l'accent ; seule la couleur qui rayonne change.

---

## 6. Écran « Personnalisation » + entrée sidebar

- **Nouvelle fenêtre MDI** « Personnalisation de l'application » (ajout au registre des fenêtres),
  disposition split : **réglages à gauche / aperçu live à droite**.
- **Onglets** : *Identité* (logo drag-and-drop + aperçu, nom, sigle, slogan, coordonnées) ·
  *Apparence* (thème Clair/Sombre/Auto, presets + couleur libre) · *Documents* (logo/cachet impression,
  en-tête, pied, mentions, n° agrément, devise, coordonnées bancaires).
- **Aperçu live** (3 vues) : Connexion · Application · Document — reflète logo/nom/couleurs/thème en direct.
- **Boutons** : *Appliquer* (écrit `branding.json` → rafraîchissement live) · *Réinitialiser* (défauts TCIT).
- **Entrée** : bouton **⚙️ « Paramètres »** ajouté **en bas de `NavSidebar.tsx`** (sous les 6 boutons
  existants, poussé en bas via `margin-top:auto`), **même style** que les autres (icône + label,
  indicateur actif). Ouvre la fenêtre Personnalisation. Codé **avec** la fenêtre (jamais un bouton vide).

---

## 7. Où la marque apparaît — et limite

**S'applique à :** écran de connexion, en-tête / sidebar, **splash** (les 3 apps), **documents imprimés**
(carte grise, facture, fiche ID, feuillets assurance).

**⚠️ Limite (dite à l'utilisateur) :** l'**icône du fichier `.exe`** reste figée au build (fixée une fois
au packaging avec l'icône TCIT/client). Le logo personnalisé ne la remplace pas à l'exécution.

---

## 8. Rafraîchissement live

« Appliquer » réécrit `branding.json`. L'app émettrice recharge le provider immédiatement ; les autres
fenêtres/apps se mettent à jour via l'évènement de changement de fichier (même mécanisme que la base
partagée — `watch` côté main → diffusion aux renderers). Pas de redémarrage requis.

---

## 9. Robustesse / secours

- Fichier absent / illisible / version inconnue → **défauts TCIT** (identité actuelle, thème clair). Jamais d'erreur bloquante.
- Logo trop lourd → borne de taille (ex. 512 Ko) + compression/avertissement à l'import.
- Couleur invalide → repli sur le bleu TCIT.
- `theme` inconnu → « clair ».

---

## 10. Découpage d'implémentation (détaillé en /planification)

1. **`tcit-ui`** : `cheminBranding`, loader, `BrandingProvider`, tokens sombres (variables CSS additives), types.
2. **App principale** : `ConfigProvider` (algorithme + accent), fenêtre Personnalisation (3 onglets + aperçu),
   écriture `branding.json`, bouton ⚙️ dans `NavSidebar.tsx`, application marque aux écrans + documents + splash.
3. **Affichage / Pointage** : monter le `BrandingProvider`, appliquer marque + thème au splash et à l'UI.
4. **Live refresh** : `watch` du fichier côté main + diffusion.

---

## 11. Stratégie de test

- Unitaire : `chargerBranding` (défauts, fichier partiel, version inconnue, couleur invalide).
- Intégration : « Appliquer » → `branding.json` écrit → provider rechargé → variables/`data-theme` à jour.
- Visuel (Electron réel) : clair inchangé vs sombre ; accent bleu ↔ émeraude ; marque sur login/splash/document ;
  cohérence sur les 3 apps.
- **Non-régression clair** : capturer l'app actuelle AVANT, comparer APRÈS → zéro différence en clair.

---

## Références
Maquette validée : `STCA-Electron/prototype-html/personnalisation-propositions.html`.
Connexes : [[project-tcit-design-system]], [[feedback-stca-design]], [[project-stca-mdi-architecture]],
[[project-stca-prototype-methodology]].
