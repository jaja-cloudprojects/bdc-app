# Beauté du Cil — Application mobile + Backend

Application complète pour **Beauté du Cil Collection** : boutique, espace élèves, chat support, masterclasses et notifications push.

## Architecture

```
bdc-app/
├── mobile/          React Native (Expo SDK 54) — app iOS / Android / Web
├── backend/         Node.js + Express + Prisma + PostgreSQL
├── docs/            Documentation déploiement, BDD, tests
└── docker-compose.yml   Stack locale complète (DB + API)
```

## Démarrage rapide (5 minutes)

### Prérequis
- Node.js ≥ 20
- Docker + Docker Compose (recommandé) **ou** PostgreSQL 16 local
- Expo CLI : `npm install -g eas-cli`

### 1. Lancer le backend

```bash
# Option A — via Docker (le plus simple)
cp backend/.env.example backend/.env
docker compose up -d
docker compose exec api npm run db:seed

# Option B — natif
cd backend
cp .env.example .env
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

L'API tourne sur `http://localhost:4000` — panneau admin : `http://localhost:4000/admin`.

**Identifiants seed :**
- Admin : `admin@beauteducil.com` / `ChangeMeNow!`
- Élève : `chloe@test.com` / `password123`

### 2. Lancer l'app mobile

```bash
cd mobile
npm install
npx expo start
```

Scannez le QR code avec l'app **Expo Go** (iOS/Android) ou lancez en simulateur avec `i` / `a`.

## Documentation

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Déploiement production (Expo EAS, backend, CI/CD)
- [`docs/DATABASE.md`](docs/DATABASE.md) — Schéma, migrations, backup, maintenance
- [`docs/TESTING.md`](docs/TESTING.md) — Tests unitaires, E2E, preview builds
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — Flux techniques (auth, push, upload)

## Stack

| Composant | Technologie |
|---|---|
| Mobile | Expo SDK 54, React Native 0.76, expo-router 4, TypeScript |
| State | TanStack Query, Zustand, React Context |
| Backend | Node 20, Express 4, Prisma 5, PostgreSQL 16 |
| Auth | JWT (access 15min + refresh 30j), bcryptjs |
| Push | expo-server-sdk, FCM v1 |
| Upload | multer (disk), servable via `/uploads` |
| Admin | HTML statique servi par Express, zéro build |

## Fonctionnalités

**App mobile**
- Boutique : catégories, produits, fiches produit
- Espace élèves avec login sécurisé (JWT + refresh)
- Dashboard : documents, fiches pratiques, profil, aide
- Chat temps réel avec BDC Bot
- Réservation de masterclasses
- Push notifications (nouvelles actus, confirmations réservation)
- Responsive : phones (iPhone SE → Pro Max), tablettes (iPad, Android)

**Backend**
- API REST versionnée (`/api/v1/*`)
- Rate limiting sur endpoints publics + auth
- Health check (`/health`)
- Admin panel web complet (CRUD + push broadcast)
- Seed automatique avec données de démo

## Licence

Propriétaire — Beauté du Cil.
