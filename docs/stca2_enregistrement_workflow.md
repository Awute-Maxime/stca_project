# Workflow complet — Enregistrement des Véhicules (STCA-II)

> Étudié le 14/06/2026 par exploration directe de l'application WinDev STCA-II.

---

## 1. Accès au formulaire

Depuis l'écran principal (roue de navigation), double-clic sur l'icône **"Enregistrement"**.

---

## 2. Champs du formulaire

### En-tête (auto)
| Champ | Type | Notes |
|---|---|---|
| Référence | Auto (entier) | 0 à la saisie → numéro DB après save (ex: 610 268) |
| En date du | Date auto | Date du jour (modifiable) |

### Section "Coordonnées Acheteur"
| Champ | Type | Obligatoire | Exemple |
|---|---|---|---|
| Nom et prénom | Texte libre | ✓ | AWUTE KOSSI |
| Pays Résidence | Texte libre | ✓ | Togo |
| Pays Destination | Texte libre | ✓ | Burkina-Faso |

### Section "Description du véhicule"
| Champ | Type | Obligatoire | Exemple / Options |
|---|---|---|---|
| Véhicule à assurer | ComboBox (3) | ✓ | Voiture / Camion / Autre |
| Véhicule sortant du Parc | Texte (réf. COTEC) | Non | Lien optionnel vers évaluation COTEC |
| A Destination de | ComboBox (10 codes) | ✓ | Voir table ci-dessous |
| Montant | Auto-calculé | — | Calculé selon destination (ex: 10 000 FCFA) |
| Marque - Modèle | ComboBox / Texte | ✓ | TOYOTA COROLLA |
| N° de Tri | Texte | ✓ (bordure rouge) | 1550 |
| Transit (maison) | Texte libre | ✓ | ABC TRANS |
| Date N° Tri | Date | ✓ | 14/06/2026 |
| N° de Châssis | Texte libre | ✓ | JT2DE35U0R0123457 |
| Code auto (T####) | Auto-généré | — | Apparaît en bas droite (ex: T7469) |

### Section basse (optionnel)
| Champ | Type | Notes |
|---|---|---|
| Saisir l'ancienne immatriculation | Checkbox | Si véhicule avec ancienne plaque |
| Ancienne immatriculation | Texte | Activé si checkbox cochée |
| Recycler 'Plaque Perdue' | Checkbox NON | Cas de plaque perdue |

---

## 3. Codes "A Destination de" (bureaux douaniers frontière)

| Code | Nom complet | Pays desservi |
|---|---|---|
| AFO | Afolé | ? |
| CK | Cinkassé | **Burkina-Faso** |
| KA | Kambolé | **Ghana** |
| KE | ? | ? |
| KP | ? | ? |
| KW | ? | ? |
| NO | ? | **Ghana** (alternative) |
| POL | ? | ? |
| S\C | ? | ? |
| TO | ? | ? |

> ⚠️ Table à compléter lors de la phase amélioration. Le code sélectionné déclenche l'affichage du nom complet en bannière rouge et le calcul automatique du **Montant**.

---

## 4. Lien COTEC (optionnel)

- **COTEC** est une application séparée qui évalue les véhicules (valeur douanière).
- En mode normal : on recherche d'abord l'évaluation dans COTEC, puis on la copie dans STCA → les champs véhicule s'auto-remplissent.
- En **mode saisie manuelle indépendante** : on remplit directement tous les champs sans passer par COTEC.

---

## 5. Bouton Enregistrer

- Le bouton **"Enregistrer"** n'apparaît qu'une fois tous les champs obligatoires remplis.
- Il est positionné en **bas à droite** du formulaire.

---

## 6. Actions après clic sur "Enregistrer"

### 6a. Sauvegarde DB
- Les données sont enregistrées dans la base HFSQL.
- La **Référence** passe de 0 à un numéro auto-incrémenté (ex: **610 268**).

### 6b. Envoi Poste Plaques (réseau)
- STCA tente de se connecter au **serveur "Poste Plaques"** via socket (IP: 192.168.0.25).
- Ce serveur gère l'attribution et l'impression des plaques d'immatriculation de transit.
- Si le serveur est hors ligne → message d'erreur : *"Impossible de connecter au serveur socket"* → OK → on continue.
- En bas du form apparaît le statut : **"Envoie IMMAT. Poste Plaques..."**

### 6c. Dialog "Edition Documents : NORMALE"
S'ouvre automatiquement après l'enregistrement. Propose 10 options d'impression :

| Option | Documents inclus |
|---|---|
| **Tous (Facture - CG - Assurances)** | Tout en une fois ← défaut |
| Facture + Carte Grise | Facture + CG |
| Carte Grise + Fiche ID Jaune | CG + Fiche jaune |
| Toutes Assurances | 3 feuillets assurance |
| Uniquement Facture | Facture seule |
| Uniquement Carte Grise | CG seule |
| Uniquement Fiche ID Jaune | Fiche jaune seule |
| Feuillet N°1 Assurance (Bleu) | 1er feuillet |
| Feuillet N°2 Assurance (Rose) | 2ème feuillet |
| Feuillet N°3 Cond. Part. (Blanc A4) | 3ème feuillet |

- Case **"Prévisualiser"** : aperçu avant impression.
- Bouton **"Imprimer"** : lance l'impression sur l'imprimante configurée.

---

## 7. État final du formulaire après impression

Le formulaire reste affiché avec les données sauvegardées en mode lecture, et deux nouveaux boutons apparaissent en bas :

| Bouton | Action |
|---|---|
| **Nouveau** | Réinitialise le formulaire pour un nouvel enregistrement |
| **Imprimer** | Réimprime les documents du registrement en cours |

---

## 8. Documents générés par un enregistrement

1. **Facture** — Reçu de paiement (10 000 FCFA)
2. **Carte Grise (CG)** — Carte grise de transit
3. **Fiche ID Jaune** — Fiche d'identification véhicule
4. **Feuillet N°1 Assurance (Bleu)**
5. **Feuillet N°2 Assurance (Rose)**
6. **Feuillet N°3 Cond. Part. (Blanc A4)** — Conditions particulières

---

## 9. Résumé du flux complet

```
[Saisie formulaire]
        ↓
[Tous champs obligatoires remplis → bouton "Enregistrer" apparaît]
        ↓
[Clic Enregistrer]
        ↓
[Sauvegarde HFSQL → Référence = 610 268]
        ↓
[Envoi socket → Poste Plaques 192.168.0.25] ← peut échouer si hors ligne
        ↓
[Dialog "Edition Documents : NORMALE"]
        ↓
[Choix documents + Imprimer]
        ↓
[Impression : Facture + CG + Assurances (3 feuillets) + Fiche ID Jaune]
        ↓
[Formulaire en mode lecture : Nouveau | Imprimer]
```
