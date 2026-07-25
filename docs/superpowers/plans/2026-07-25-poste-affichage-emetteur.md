# Plan d'Implémentation : Poste d'affichage (Plan B — émetteur STCA + Config)

**Objectif :** Brancher STCA-Electron à l'app d'affichage : client WebSocket dans le main (buffer hors ligne + reconnexion + ack), envoi après chaque enregistrement, et fenêtre « Configuration des connexions » à onglets.

**Architecture :** `afficheur.ts` (main) = client `ws` piloté par la config (Parametre) ; envoie/bufferise les enregistrements, se reconnecte seul, vide le buffer à l'`ack`. IPC pour config get/set, envoyer, tester, état. Le renderer (EnregistrementPage) appelle l'envoi après une sauvegarde réussie ; la fenêtre Config gère la config.

**Stack :** STCA-Electron (Electron 28 + React + AntD 5 + TS) + `ws`. Test local : les 2 apps sur le même PC, STCA → `127.0.0.1:8000`.

**Points d'ancrage repérés :**
- Envoi : `EnregistrementPage.tsx:425-440` (stub notification « Poste Plaques hors ligne » à remplacer).
- Config Parametre : `referentiels.ts` `getParam/setParam` (privés) → ajouter `getAffichageConfig/setAffichageConfig`.
- Fenêtre : `WINDOW_REGISTRY.ts:36` (`outils.posteImmat`), routage `WindowContent.tsx:110`, menu `MenuBar.tsx:59`, stub `OutilsSimpleWindows.tsx:218`.

---

## Tâche 1 : Dépendance `ws` + protocole

- [ ] **Étape 1** : `cd STCA-Electron && npm install ws @types/ws`
- [ ] **Étape 2** : copier les types dans `src/main/protocoleAffichage.ts` (EnregistrementMessage, AckMessage — identiques à STCA-Affichage/src/shared/protocole.ts, sans parserMessage côté émetteur).
- [ ] **Étape 3** : commit `chore(affichage): dep ws + types protocole`

## Tâche 2 : Buffer (logique pure) + test

**Fichier :** `src/main/afficheurBuffer.ts` + `src/renderer/... ` non — test dans `src/main/afficheurBuffer.test.ts` (vitest).

- [ ] **Étape 1 : test qui échoue** — `empiler` (dédoublonne par reference, plafonne à 500 en jetant le plus vieux), `retirerAck` (retire par reference).
```ts
import { empiler, retirerAck } from './afficheurBuffer'
// empiler ajoute ; doublon reference = remplace ; > 500 jette le plus vieux
// retirerAck('42') retire l'entrée 42
```
- [ ] **Étape 2 : implémentation**
```ts
import type { EnregistrementMessage } from './protocoleAffichage'
export const MAX_BUFFER = 500
export function empiler(buf: EnregistrementMessage[], m: EnregistrementMessage): EnregistrementMessage[] {
  const sansDoublon = buf.filter(x => x.reference !== m.reference)
  const suivant = [...sansDoublon, m]
  return suivant.length > MAX_BUFFER ? suivant.slice(suivant.length - MAX_BUFFER) : suivant
}
export function retirerAck(buf: EnregistrementMessage[], reference: string): EnregistrementMessage[] {
  return buf.filter(x => x.reference !== reference)
}
```
- [ ] **Étape 3** : `npx vitest run src/main/afficheurBuffer.test.ts` → vert.
- [ ] **Étape 4** : commit `feat(affichage): buffer émetteur + test`

## Tâche 3 : Client WebSocket (afficheur.ts)

**Fichier :** `src/main/afficheur.ts`

Expose : `configurerAfficheur(cfg, onEtat)`, `envoyerEnregistrement(payload)`, `testerConnexion(ip, port)`, `etatAfficheur()`. Interne : connexion `ws://ip:port`, `hello` à l'ouverture, flush buffer, `ack` → `retirerAck` + persistance (`userData/affichage-buffer.json`), reconnexion backoff (1→2→5→10→15 s). `payload` = { reference, immatriculation, numeroTri, marqueModele, chassis, destination, agent } ; le `guichet` = `cfg.nomPoste`, `horodatage` = maintenant, ajoutés ici.

- [ ] **Étape 1** : implémenter (code complet, voir §5 du doc de conception).
- [ ] **Étape 2** : commit `feat(affichage): client WebSocket + reconnexion + ack`

## Tâche 4 : Config Parametre (referentiels.ts)

**Fichier :** `src/main/referentiels.ts`

- [ ] **Étape 1** : ajouter
```ts
export interface AffichageConfig { actif: boolean; nomPoste: string; ip: string; port: number }
export async function getAffichageConfig(): Promise<AffichageConfig> {
  return {
    actif: (await getParam('affichage.actif')) === '1',
    nomPoste: (await getParam('affichage.nomPoste')) ?? '',
    ip: (await getParam('affichage.ip')) ?? '192.168.0.25',
    port: Number((await getParam('affichage.port')) ?? '8000')
  }
}
export async function setAffichageConfig(c: AffichageConfig): Promise<void> {
  await setParam('affichage.actif', c.actif ? '1' : '0')
  await setParam('affichage.nomPoste', c.nomPoste)
  await setParam('affichage.ip', c.ip)
  await setParam('affichage.port', String(c.port))
}
```
- [ ] **Étape 2** : commit avec la tâche 5.

## Tâche 5 : IPC main + preload + electron.ts

**Fichiers :** `src/main/index.ts`, `src/preload/index.ts`, `src/renderer/src/api/electron.ts`

- [ ] **Étape 1 (main)** : au `whenReady`, `const cfg = await getAffichageConfig(); configurerAfficheur(cfg, etat => diffuser('affichage:etat', etat))`. IPC :
  - `affichage:config:get` → getAffichageConfig()
  - `affichage:config:set` (cfg) → setAffichageConfig(cfg) ; configurerAfficheur(cfg, …) ; retourne ok
  - `affichage:envoyer` (payload) → envoyerEnregistrement(payload)
  - `affichage:tester` (ip, port) → testerConnexion(ip, port)
  - `affichage:etat` → etatAfficheur()
- [ ] **Étape 2 (preload)** : exposer `affichageConfigGet/Set`, `affichageEnvoyer`, `affichageTester`, `affichageEtat`, `onAffichageEtat`.
- [ ] **Étape 3 (electron.ts)** : types + wrappers (modèle `dbAdmin*`).
- [ ] **Étape 4** : commit `feat(affichage): IPC config/envoi/test + Parametre`

## Tâche 6 : Brancher l'envoi après enregistrement

**Fichier :** `src/renderer/src/pages/EnregistrementPage.tsx:425-440`

- [ ] **Étape 1** : remplacer le stub notification par :
```ts
void electronApi.affichageEnvoyer({
  reference: ref,
  immatriculation: immatGenere ?? '',
  numeroTri: numTri,
  marqueModele,
  chassis,
  destination: destination ?? '',
  agent: localStorage.getItem('tcit_session_login') ?? 'awute'
})
```
  (l'envoi ne bloque jamais la sauvegarde ; si l'affichage est actif et joignable → affiché ; sinon bufferisé.)
- [ ] **Étape 2** : commit `feat(affichage): envoi après enregistrement`

## Tâche 7 : Fenêtre « Configuration des connexions » (à onglets)

**Fichiers :** Créer `src/renderer/src/pages/ConfigConnexionsWindow.tsx` ; Modifier `WINDOW_REGISTRY.ts:36` (titre), `WindowContent.tsx` (routage), `MenuBar.tsx:59` (libellé).

- [ ] **Étape 1** : composant à onglets (AntD `Tabs`) — onglet « Poste d'affichage » : Switch activer, champ « Nom de ce poste » (pré-rempli via `os.hostname()` exposé par IPC ou `affichage.nomPoste` déjà en base), IP, Port, bouton **Tester** (→ `affichageTester`, toast succès/échec), Valider (→ `affichageConfigSet`). Style maison (sub-header beige, cf. [[feedback-coherence-reference-existant]]). Onglet « Mode assurance » : réservé/désactivé (« à venir »).
- [ ] **Étape 2** : `WINDOW_REGISTRY['outils.posteImmat']` → titre « Configuration des connexions », taille 720×560. Routage `WindowContent` → `<ConfigConnexionsWindow/>`. Menu → libellé « Configuration des connexions ».
- [ ] **Étape 3** : garde admin (déjà `outils.posteImmat` dans FENETRES_ADMIN ? sinon l'ajouter).
- [ ] **Étape 4** : commit `feat(affichage): fenêtre Configuration des connexions (onglets)`

## Tâche 8 : Test E2E local (2 apps sur le même PC)

- [ ] **Étape 1** : lancer STCA-Affichage (serveur `:8000`) ET STCA-Electron.
- [ ] **Étape 2** : dans STCA, ouvrir Config connexions → activer, IP `127.0.0.1`, port `8000`, Tester (vert), Valider.
- [ ] **Étape 3** : faire un enregistrement dans STCA → vérifier qu'il **apparaît sur l'écran d'affichage** (héros + file).
- [ ] **Étape 4** : couper l'affichage, enregistrer → bufferisé ; relancer l'affichage → l'enregistrement **remonte** (flush).
- [ ] **Étape 5** : commit `test(affichage): E2E émetteur↔affichage en local`

## Auto-évaluation
- Couverture : dep+types (T1), buffer+test (T2), client WS (T3), config Parametre (T4), IPC (T5), envoi (T6), fenêtre onglets (T7), E2E local (T8). Couvre §3.1/§3.2/§5 du doc de conception.
- Cohérence : `configurerAfficheur`, `envoyerEnregistrement`, `testerConnexion`, `etatAfficheur`, `empiler`, `retirerAck`, `getAffichageConfig`, IPC `affichage:*`.
