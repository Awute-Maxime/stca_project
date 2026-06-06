# STCA-Electron

Reproduction moderne de l'application **STCA II** (Système de Transit et Contrôle des Automobiles) — Togo.

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Desktop | Electron |
| Frontend | React + Ant Design + Framer Motion + Tailwind CSS |
| Backend | Node.js + Express |
| ORM | Prisma |
| Base de données | PostgreSQL |
| Packaging | Electron Builder |

## Architecture

Application **Client/Serveur** :
- Clients Electron installés sur les postes de travail
- Serveur Node.js + PostgreSQL (local LAN ou VPS en ligne)

## Documentation

Voir [`docs/session-exploration-STCA-II.md`](docs/session-exploration-STCA-II.md) pour les notes complètes d'exploration de l'application existante.

## Statut

- [x] Phase 1 — Analyse et décisions d'architecture
- [ ] Phase 2 — Exploration complète de l'application existante (en cours)
- [ ] Phase 3 — Développement
