# Conception : Poste d'affichage « N° Immatriculation + N° Tri »

**Objectif :** Une petite application autonome qui reçoit par le réseau les informations de chaque enregistrement (immatriculation, tri, etc.) et les affiche en grand pour les opérateurs de plaques, avec un mode réduit (dernier véhicule) et un mode déroulé (file d'attente).

**Architecture :** App Electron autonome jouant le rôle de **serveur WebSocket** ; chaque guichet STCA-Electron est un **client** qui pousse un message JSON après chaque enregistrement. Aucun accès base : l'écran n'affiche que ce qu'on lui envoie. La file d'attente vit en mémoire, persistée localement pour survivre à un redémarrage.

**Stack technique :** Electron + React + Ant Design 5 + TypeScript (même socle que STCA-Electron) ; bibliothèque `ws` (Node) pour le WebSocket côté serveur et côté client.

---

## 1. Contexte & décisions validées

Reproduction modernisée du « Poste Plaques » de l'ancien STCA II (capture fournie : fenêtre « N° Immatriculation + N° Tri à Traiter », mode réduit + tableau déroulé « Adresse IP · Nom du Poste · N° Immat · Destination · N° Tri »).

L'ancien STCA envoyait les données par **socket TCP** vers ce poste (config `192.168.0.25:8000`). Le **format exact des octets WinDev n'a pas été rétro-conçu** — sans importance : nous construisons les **deux bouts** (émetteur STCA-Electron + récepteur), donc nous définissons notre propre protocole.

Décisions prises pendant le brainstorming (25/07/2026) :

| Sujet | Décision |
|---|---|
| Nature | App Electron **autonome** sur le PC d'affichage |
| Rôle réseau | Écran = **serveur** (écoute), guichets STCA = **clients** |
| Transport | **WebSocket** (temps réel + indicateur « en ligne » des deux côtés) |
| Infos affichées | Immat, Tri, Marque/Modèle, Châssis, Destination (couleur), Guichet + Agent, ancienneté |
| Sortie de file | Clic **« Plaque traitée »** par l'opérateur (retire de la file) |
| Périmètre | **Bout en bout** : écran + émetteur STCA + fenêtre Config. Poste |
| Robustesse | File **persistée** (survit au redémarrage) ; STCA **bufferise** si l'écran est hors ligne ; **signal sonore** à chaque arrivée |
| Hors robustesse | Pas de démarrage auto/kiosque forcé (le plein écran reste manuel) |

**Design visuel validé** — maquette de référence : [`prototype-html/poste-affichage-propositions.html`](../../../prototype-html/poste-affichage-propositions.html)
En-tête et pied **bleu nuit** (`#1B3A6B`, comme MainScreen), corps **blanc dégradé** (effet 3D des cartes), immatriculation géante marine + numéro central bleu accent, badge destination coloré, panneau « File d'attente » encadré d'un trait fin, fin liseré bleu autour de la fenêtre, trait drapeau togolais subtil sur le bord supérieur du pied. Finition premium à appliquer plus tard.

---

## 2. Architecture d'ensemble

Trois composants :

```
┌─────────────────────────┐         WebSocket          ┌──────────────────────────┐
│  STCA-Electron (guichet) │  ── message JSON  ───────▶ │  App d'affichage (serveur)│
│  - après enregistrement  │  ◀── ack {reference} ───   │  192.168.0.25:8000        │
│  - buffer local si hors  │                            │  - file en mémoire        │
│    ligne + reconnexion   │         (plusieurs         │  - persistée sur disque   │
│  - Config. Poste (IP/port)│         guichets possibles)│  - modes réduit/déroulé   │
└─────────────────────────┘                            └──────────────────────────┘
```

- **Plusieurs guichets** peuvent alimenter **un seul écran** (d'où « Adresse IP » + « Nom du Poste »).
- L'écran est **maître de sa file** : le clic « traité » agit localement, il ne renvoie rien à STCA.

### 2.1 Emplacement du code (à confirmer)
Recommandation : **nouveau projet Electron autonome** dans un dossier séparé (ex. `STCA-Affichage/`, voisin de `STCA-Electron/`), même stack, **jetons visuels TCIT copiés** (palette, trait drapeau). Avantage : build et installateur **indépendants** (l'écran n'embarque pas tout STCA). Inconvénient : un peu de duplication des jetons de style (acceptable, périmètre réduit).

---

## 3. Protocole de communication (WebSocket)

### 3.1 Connexion
- L'app d'affichage démarre un serveur `ws` sur le port configuré (défaut **8000**).
- Chaque guichet STCA se connecte comme client et envoie d'abord un message d'identification (`hello`).
- L'écran affiche « ● {Guichet} connecté » ; s'il n'y a personne, « ● Aucun guichet connecté ».
- **Heartbeat** ping/pong (~10 s) : si un client ne répond plus, l'écran le marque hors ligne.
- Le client STCA se **reconnecte automatiquement** (backoff progressif : 1 s, 2 s, 5 s, plafonné à ~15 s).

### 3.2 Messages (JSON)

**Guichet → Écran — identification :**
```json
{ "type": "hello", "guichet": "Principal", "version": "1.0" }
```

**Guichet → Écran — enregistrement (le message principal) :**
```json
{
  "type": "enregistrement",
  "reference": "010234",
  "immatriculation": "TG WZ C 1847 KE",
  "numeroTri": "021094",
  "marqueModele": "TOYOTA COROLLA",
  "chassis": "2T3P1RFV7KW054154",
  "destination": "KE",
  "guichet": "Principal",
  "agent": "awute",
  "horodatage": "2026-07-25T13:14:00.000Z"
}
```
- `reference` = **identifiant unique** de l'enregistrement (clé de dédoublonnage + cible du « traité »).
- `destination` = **code** ; l'écran applique lui-même la couleur (il embarque une copie de la palette de destinations). Ainsi l'émetteur n'a rien à savoir des couleurs.

**Écran → Guichet — accusé de réception :**
```json
{ "type": "ack", "reference": "010234" }
```
- À réception de l'`ack`, STCA **retire le message de son buffer** (garantie de livraison « au moins une fois »).
- L'écran **dédoublonne** par `reference` : recevoir deux fois la même n'ajoute pas de doublon (cas d'un renvoi après reconnexion).

### 3.3 Test de connexion (fenêtre Config. Poste)
Le bouton **Tester** ouvre une connexion éphémère vers `IP:port`, attend un pong, puis se referme : succès → « Poste d'affichage joignable » ; échec/timeout → message d'erreur clair.

---

## 4. Côté écran — file d'attente & affichage

### 4.1 Modèle de données (en mémoire)
```ts
interface VehiculeFile {
  reference: string
  immatriculation: string
  numeroTri: string
  marqueModele: string
  chassis: string
  destination: string       // code
  guichet: string
  agent: string
  recuLe: number            // timestamp de réception (pour l'ancienneté)
}
```
- `file: VehiculeFile[]` triée du plus récent au plus ancien.
- **Courant (héros)** = `file[0]` (le dernier reçu).
- Ajout d'un message : dédoublonnage par `reference`, insertion en tête, signal sonore, ré-affichage.
- Clic **« Plaque traitée »** : retire l'élément (par `reference`).

### 4.2 Persistance (survit au redémarrage)
- À **chaque changement** de la file, écriture d'un fichier local JSON (dossier `userData`).
- Au **démarrage**, lecture de ce fichier → la file est restaurée.
- Purge de sécurité optionnelle au chargement : entrées de plus de 24 h ignorées (évite d'accumuler indéfiniment si personne ne clique « traité »).

### 4.3 Modes d'affichage
- **Déroulé** : héros + panneau « File d'attente » complet.
- **Réduit** : uniquement le héros (immatriculation géante) + rappel « N en attente ».
- **Plein écran (kiosque)** : bascule manuelle (touche F11 / bouton) — pas de lancement auto imposé.
- L'ancienneté (« il y a 2 min ») se rafraîchit toutes les ~15 s.

### 4.4 Signal sonore
- Court « bip » discret joué à chaque **nouveau** véhicule (asset audio embarqué).
- **Désactivable** (petit réglage persistant, ex. icône haut-parleur dans l'en-tête).

---

## 5. Côté STCA-Electron — émetteur

### 5.1 Intégration
- Module client WebSocket dans le **processus principal** (Node), piloté par IPC depuis le renderer.
- Après un **enregistrement réussi** (dans le flux de sauvegarde existant), STCA construit le message et l'envoie **si l'envoi est activé** dans la config.
- L'échec d'envoi **ne bloque jamais** l'enregistrement (comportement de l'ancien : « peut échouer si serveur absent »).

### 5.2 Buffer hors ligne
- Si l'écran est injoignable, le message est empilé dans un **buffer local persistant** (fichier).
- À la (re)connexion, STCA **vide le buffer** dans l'ordre ; chaque message est retiré du buffer à réception de son `ack`.
- Le buffer est plafonné (ex. 500 messages / 48 h) pour éviter une croissance sans fin.

### 5.3 Fenêtre « Config. Poste N° IMMAT. »
Reprend la fenêtre aujourd'hui à l'état de coquille vide (`OutilsSimpleWindows.tsx`), refaite d'après la capture réelle :
- Case **« Activer l'envoi vers le poste d'affichage »**.
- **Adresse IP** du PC d'affichage (défaut `192.168.0.25`).
- **N° de Port** (défaut `8000`).
- Bouton **Tester** (icône serveur) → test réel (§3.3).
- Valider / Fermer. Réglages persistés (table `Parametre` côté base, cohérent avec la migration Phase 3, ou localStorage en attendant).

> ⚠️ **À vérifier au moment de coder** (Règle 20) : la capture de cette fenêtre mentionnait aussi un « mode de fonctionnement avec Assurance ». Il faudra confirmer avec l'utilisateur si cette case est le **même interrupteur** que la « mise en service » de Config. Assurances, ou un réglage distinct. Pour ce lot, on ne traite QUE l'envoi vers l'affichage ; la sémantique « mode assurance » reste hors périmètre.

---

## 6. Améliorations vs l'ancien poste

| Ancien | Nouveau |
|---|---|
| Immat + Tri + Destination + IP + Poste | + Marque/Modèle, Châssis, Agent, ancienneté |
| Affichage passif | Clic **« traité »** (file = réalité de ce qui attend) |
| Perte au redémarrage (supposée) | File **persistée** |
| Envoi « best effort » | **Buffer + reconnexion** (aucun enregistrement perdu) |
| Pas de retour d'état | Indicateur **« en ligne / hors ligne »** en direct + son |
| Style WinDev daté | Identité **TCIT** (bleu nuit / blanc, drapeau, 3D) |

---

## 7. Sécurité & réseau (hypothèses)
- Réseau **local de confiance** (LAN interne du bureau des douanes/TCIT) — comme l'ancien.
- **Pas d'authentification** sur le WebSocket dans ce lot (parité avec l'existant). À réévaluer si un jour le trafic sort du LAN.
- Données non sensibles au sens strict (immat + tri), mais rester sur le LAN.

---

## 8. Stratégie de test

**Unitaires :**
- Analyse/validation d'un message entrant (champs requis, JSON malformé rejeté proprement).
- Réducteur de file : ajout, dédoublonnage par `reference`, retrait « traité », tri par récence.
- Persistance : sauvegarde puis rechargement redonnent la même file ; purge > 24 h.
- Buffer STCA : empilement hors ligne, vidage à la reconnexion, retrait sur `ack`, plafond respecté.

**Intégration / E2E (réel, via CDP) :**
- Lancer l'app d'affichage ; un **client WebSocket factice** envoie 3 messages → vérifier l'affichage (héros + file) à l'écran.
- Simuler une **coupure** (fermer le serveur) pendant un enregistrement STCA → message bufferisé ; **rouvrir** → le message apparaît (flush).
- Cliquer **« traité »** → l'élément disparaît ; le héros passe au suivant.
- **Redémarrer** l'app d'affichage → la file est retrouvée.
- Bouton **Tester** de la config : vert si joignable, erreur sinon.

---

## 9. Périmètre

**Inclus :** app d'affichage (serveur WS, file, modes réduit/déroulé/plein écran, persistance, son) ; émetteur STCA (après enregistrement, buffer, reconnexion) ; fenêtre Config. Poste (IP/port/activer/Tester).

**Exclus (pour plus tard) :** finition visuelle premium (couleurs/détails de haut niveau — passe dédiée) ; démarrage auto/kiosque imposé ; authentification réseau ; sémantique « mode assurance » de la fenêtre Config ; toute logique base de données côté écran (par nature, il n'en a pas).

---

## 10. Structure de fichiers proposée (indicative)

**App d'affichage (`STCA-Affichage/`) :**
- `src/main/index.ts` — fenêtre + serveur WebSocket (`ws`), heartbeat, ack.
- `src/main/fileStore.ts` — persistance de la file (lecture/écriture `userData`).
- `src/preload/index.ts` — pont IPC (file, état connexions, réglage son).
- `src/renderer/.../PosteAffichage.tsx` — l'écran (héros + file, modes).
- `src/renderer/.../theme.ts` — jetons TCIT copiés + palette destinations.
- `assets/bip.mp3` — signal sonore.

**STCA-Electron (existant, à étendre) :**
- `src/main/afficheur.ts` (nouveau) — client WebSocket, buffer, reconnexion.
- `src/main/index.ts` — IPC `affichage:envoyer` / `affichage:tester` / `affichage:etat`.
- `src/preload/index.ts` + `@api/electron` — exposition des IPC.
- Flux de sauvegarde d'enregistrement — appel de l'envoi après succès.
- `OutilsSimpleWindows.tsx` (ou fichier dédié) — fenêtre Config. Poste refaite.
- Réglages `Parametre` : `affichage.actif`, `affichage.ip`, `affichage.port`.

---

## 11. Questions ouvertes / risques
1. **Emplacement du code** (§2.1) : projet séparé `STCA-Affichage/` — à confirmer.
2. **Fenêtre Config** : sémantique du « mode assurance » à clarifier avec l'utilisateur avant de coder cette fenêtre (§5.3).
3. **Nom du poste / IP source** : l'« Adresse IP » affichée = IP de la connexion entrante (fournie par le serveur) ; le « Nom du Poste » vient du `hello` (`guichet`). Cohérent avec les colonnes de la capture.
4. **Format d'immatriculation** : on envoie la chaîne complète déjà formatée (`TG WZ C 1847 KE`) — plus simple et sûr que de reconstruire côté écran.
