# Déploiement

Ce document couvre le déploiement du **backend** (API + admin panel) et de l'**app mobile** (iOS + Android + Web) en environnements Dev → Preview → Production.

## 1. Backend

### 1.1 Configuration de production

Variables d'environnement obligatoires :

```env
NODE_ENV=production
PORT=4000
DATABASE_URL=postgresql://USER:PWD@HOST:5432/bdc_db?schema=public&sslmode=require

# Secrets — GÉNÉRER DES CHAÎNES ALÉATOIRES DE 64+ CARACTÈRES
JWT_SECRET=<openssl rand -hex 64>
JWT_REFRESH_SECRET=<openssl rand -hex 64>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# CORS — liste blanche des origines front
CORS_ORIGIN=https://beauteducil.com,https://app.beauteducil.com

# Storage
UPLOAD_DIR=/var/data/uploads
MAX_FILE_SIZE=10485760
PUBLIC_BASE_URL=https://api.beauteducil.com

# Admin bootstrap (pour le seed initial seulement)
ADMIN_EMAIL=admin@beauteducil.com
ADMIN_PASSWORD=<STRONG_PASSWORD>

# Optionnel — token Expo pour meilleur rate limit / FCM v1
EXPO_ACCESS_TOKEN=
```

### 1.2 Hébergement recommandé

| Plateforme | Avantages | Commande clé |
|---|---|---|
| **Railway** | Déploie Dockerfile + Postgres managé en 1-clic | `railway up` |
| **Render** | Free tier, auto-TLS, Postgres addon | Auto via Git |
| **Fly.io** | Multi-région, bon pour push mondial | `fly deploy` |
| **DigitalOcean App Platform** | Prévisible, Postgres managé | Auto via Git |
| **VPS + Caddy** | Le moins cher, contrôle total | `docker compose up -d` |

### 1.3 Déploiement Docker (VPS)

Sur un VPS Ubuntu 22+ :

```bash
# 1. Installer Docker
curl -fsSL https://get.docker.com | sh

# 2. Cloner et configurer
git clone <votre-repo>.git /opt/bdc && cd /opt/bdc
cp backend/.env.example backend/.env
nano backend/.env  # remplir toutes les valeurs de production

# 3. Lancer
docker compose up -d
docker compose exec api npm run db:seed  # première fois seulement

# 4. Reverse proxy avec Caddy (auto-HTTPS)
cat > /etc/caddy/Caddyfile <<EOF
api.beauteducil.com {
  reverse_proxy localhost:4000
}
EOF
sudo systemctl reload caddy
```

### 1.4 Migrations en production

```bash
# Mode "safe" — applique les migrations existantes sans en créer
docker compose exec api npx prisma migrate deploy

# JAMAIS utiliser `migrate dev` ou `migrate reset` en production.
```

### 1.5 Mises à jour zero-downtime

```bash
git pull
docker compose build api
docker compose up -d --no-deps api  # rolling update uniquement de l'API
docker compose exec api npx prisma migrate deploy
```

### 1.6 Monitoring minimum

- **Health endpoint** : `GET /health` → 200 si OK, 503 si DB down
- **Logs** : `docker compose logs -f api`
- **Métriques Prisma** : activer `PRISMA_METRICS_ENABLED=true` puis `/health/metrics`
- Intégrer Sentry/Datadog via variable `SENTRY_DSN` (à ajouter dans `src/index.ts`)

---

## 2. App Mobile — Expo EAS

### 2.1 Initialisation (une seule fois)

```bash
cd mobile
npm install -g eas-cli
eas login
eas init            # crée un projectId EAS
# Remplacer "your-eas-project-id" dans app.json et eas.json par l'ID généré
```

### 2.2 Canaux de déploiement

Trois environnements sont configurés dans `eas.json` :

| Canal | Usage | API cible | Distribution |
|---|---|---|---|
| `development` | Dev local + simulateurs | `http://localhost:4000` | Internal |
| `preview` | Tests internes (QA, client) | `https://staging-api.beauteducil.com` | APK / TestFlight internal |
| `production` | App Store + Play Store | `https://api.beauteducil.com` | Store release |

### 2.3 Builds de développement (dev client)

Le dev client permet d'utiliser les modules natifs sans Expo Go.

```bash
# iOS Simulator
eas build --profile development --platform ios

# Android Emulator / APK
eas build --profile development --platform android
```

Une fois buildé, installez le `.apk` ou utilisez TestFlight pour iOS, puis :

```bash
npx expo start --dev-client
```

### 2.4 Builds de preview (QA)

```bash
eas build --profile preview --platform all
```

EAS génère :
- Un `.apk` téléchargeable (Android)
- Un lien TestFlight interne (iOS) — invitez les testeurs via App Store Connect

### 2.5 Builds de production

#### Prérequis comptes

- **Apple Developer Program** (99 USD/an) → `appleId`, `ascAppId`, `appleTeamId` dans `eas.json`
- **Google Play Console** (25 USD à vie) → générer un `google-service-account.json`

#### Build + soumission

```bash
# Build production
eas build --profile production --platform all

# Soumission automatique aux stores
eas submit --platform ios
eas submit --platform android
```

EAS gère pour vous :
- Signing iOS (provisioning, distribution cert)
- Keystore Android
- Upload App Store Connect + Play Store

### 2.6 Over-the-air updates (OTA)

Pour les changements JS/assets **sans** rebuild :

```bash
# Push une update au canal production
eas update --branch production --message "Fix bouton connexion"

# Preview
eas update --branch preview --message "Test nouvelle feature"
```

Les apps installées téléchargeront la mise à jour au prochain démarrage (selon la politique `runtimeVersion` dans `app.json`).

⚠️ Les changements **natifs** (nouveau package, permission, plugin) exigent toujours un build complet.

### 2.7 Push notifications — configuration stores

#### iOS (APNs via Expo)

1. Apple Developer → Certificates → créer une **APNs Auth Key** (.p8)
2. Upload sur Expo : `eas credentials` → iOS → Push Notifications → Upload key
3. Le projet est désormais lié aux envois Expo Push

#### Android (FCM v1)

1. Créer un projet Firebase sur [console.firebase.google.com](https://console.firebase.google.com)
2. Ajouter une app Android avec le package `com.beauteducil.app`
3. Télécharger `google-services.json`
4. Sur Expo :
   ```bash
   eas credentials
   # Sélectionner Android → FCM V1 → uploader le service account
   ```
5. Variable côté backend : `EXPO_ACCESS_TOKEN` (optionnel mais recommandé)

### 2.8 Versionning

Règle simple :

| Type de changement | Action |
|---|---|
| Fix JS/TS uniquement | `eas update` (OTA, pas de store review) |
| Ajout d'un package natif | `eas build` + soumission store (review ~1-3j) |
| Changement majeur d'UX | Incrémenter `version` dans `app.json` puis `eas build` |

---

## 3. CI/CD (GitHub Actions)

Exemple de pipeline minimal (`.github/workflows/deploy.yml`) :

```yaml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build backend
        run: |
          cd backend
          npm ci
          npm run lint
          npm run build
      - name: Deploy to Railway
        run: railway up
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}

  mobile-update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - uses: expo/expo-github-action@v8
        with:
          eas-version: latest
          token: ${{ secrets.EXPO_TOKEN }}
      - run: cd mobile && npm ci && eas update --branch production --auto
```

---

## 4. Checklist Go-Live

Avant d'ouvrir au public :

- [ ] Secrets JWT regénérés (64+ caractères aléatoires)
- [ ] `ADMIN_PASSWORD` changé après le premier seed
- [ ] HTTPS activé partout (backend via Caddy/Nginx, mobile via `https://`)
- [ ] CORS restreint aux domaines réels (pas `*`)
- [ ] Base de données sauvegardée automatiquement (voir `DATABASE.md`)
- [ ] Sentry ou autre monitoring branché
- [ ] Certificats APNs + FCM uploadés sur EAS
- [ ] `supportsTablet: true` vérifié sur iPad réel
- [ ] Build de production testé manuellement avant soumission stores
- [ ] Captures + texte App Store préparés (6,5" iPhone + 13" iPad)
- [ ] Privacy policy et CGU accessibles en URL publique
