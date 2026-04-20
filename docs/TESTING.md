# Tests

Guide complet pour tester l'app mobile et le backend, du développement local jusqu'aux builds de preview partagés avec l'équipe.

## 1. Tests backend

### 1.1 Tests manuels rapides

**Health check :**
```bash
curl http://localhost:4000/health
# {"status":"ok","db":"connected",...}
```

**Login + appel authentifié :**
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"chloe@test.com","password":"password123"}' | jq -r .token)

# 2. Appel protégé
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

**Test push depuis le panel admin :**
- Ouvrez `http://localhost:4000/admin`
- Loguez-vous avec les credentials admin
- Onglet "Notifications Push" → Envoyer

### 1.2 Tests automatisés (à ajouter)

Le projet ne ship pas avec des tests auto pour garder le MVP simple. Pour ajouter Jest :

```bash
cd backend
npm i -D jest @types/jest ts-jest supertest @types/supertest
```

`jest.config.js` :
```js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
};
```

Exemple de test (`src/routes/__tests__/auth.test.ts`) :

```typescript
import request from 'supertest';
import app from '../../index';
import { prisma } from '../../config/database';

describe('POST /auth/login', () => {
  afterAll(async () => { await prisma.$disconnect(); });

  it('rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'x@x.com', password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('returns token for valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'chloe@test.com', password: 'password123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe('chloe@test.com');
  });
});
```

**Base de données de test** : créer `bdc_test` et isoler via `DATABASE_URL` dans `.env.test`.

### 1.3 Load testing

Pour tester la tenue en charge (avant grosse campagne push) :

```bash
# Installer autocannon
npm i -g autocannon

# 100 conns pendant 30s sur /products
autocannon -c 100 -d 30 http://localhost:4000/api/v1/products
```

---

## 2. Tests mobile — développement local

### 2.1 Expo Go (le plus rapide)

Pour tester sur un téléphone physique en 30 secondes :

```bash
cd mobile
npx expo start
```

1. Installez **Expo Go** (App Store / Play Store)
2. Scannez le QR code
3. L'app charge en direct, rechargement à chaud

⚠️ **Limites d'Expo Go** :
- Pas de push notifications réelles (simulation seulement)
- Pas les modules natifs custom (OK pour ce projet)
- Pour tout tester, utilisez un **Development Build** (voir §2.3)

### 2.2 Simulateurs

```bash
# iOS (macOS uniquement, Xcode requis)
npx expo start --ios

# Android Emulator
npx expo start --android

# Web (rendu limité, utile pour debug CSS)
npx expo start --web
```

### 2.3 Development Build (recommandé pour test push)

Un dev build inclut tous les modules natifs tout en gardant le hot-reload.

```bash
# Build + install en une commande (simulateur iOS)
eas build --profile development --platform ios --local
# Puis ouvrir dans Xcode: npx expo run:ios

# Android — APK installable
eas build --profile development --platform android
# Télécharger l'APK depuis le lien EAS, l'installer
```

Une fois installé :
```bash
npx expo start --dev-client
```

L'app se connecte au dev server, mais en tant que vrai build natif — les push notifications marchent pour de vrai.

### 2.4 Tester sur plusieurs tailles d'écran

La maquette prévoit mobile + tablette. Testez au minimum :

| Device | Dimensions | Breakpoint |
|---|---|---|
| iPhone SE | 375×667 | `phone-sm` / `phone` |
| iPhone 15 Pro | 393×852 | `phone` |
| iPhone 15 Pro Max | 430×932 | `phone` |
| iPad mini | 744×1133 | `tablet-sm` |
| iPad Pro 12.9" | 1024×1366 | `tablet` |
| iPad Pro 12.9" landscape | 1366×1024 | `desktop` |

Sur iOS Simulator : `Device → Device Type` pour switcher.
Sur Android : créer plusieurs AVD dans Android Studio.

---

## 3. Preview builds — partage QA / client

### 3.1 Générer un preview

```bash
cd mobile
eas build --profile preview --platform all
```

EAS produit :
- **Android** : un `.apk` téléchargeable direct (lien EAS)
- **iOS** : un build TestFlight (internal distribution)

### 3.2 Distribution Android

1. Le build terminé, EAS donne un lien type `https://expo.dev/artifacts/.../bdc.apk`
2. Partagez le lien (email, Slack, WhatsApp)
3. Les testeurs téléchargent et installent (activer "sources inconnues" dans les paramètres Android)

### 3.3 Distribution iOS via TestFlight

1. Configuration Apple (une seule fois) :
   - Créer l'app dans **App Store Connect**
   - Récupérer l'**App Store Connect App ID** (`ascAppId`)
   - Renseigner dans `eas.json > submit.production.ios`

2. Submit :
   ```bash
   eas submit --platform ios --latest
   ```

3. Dans **App Store Connect → TestFlight** :
   - Ajoutez des **testeurs internes** (jusqu'à 100, pas de review Apple nécessaire)
   - Ou créez un **groupe de testeurs externes** (jusqu'à 10 000, review Apple 24-48h)

4. Les testeurs installent l'app TestFlight → reçoivent une invitation par email → installent votre app.

### 3.4 OTA sur un preview existant

Au lieu de regénérer un build complet pour chaque petit fix :

```bash
eas update --branch preview --message "Fix alignement header"
```

Les testeurs reçoivent la mise à jour au prochain lancement (pas de réinstallation requise).

---

## 4. Tester les push notifications

### 4.1 Depuis l'admin panel (le plus simple)

1. Lancez l'app mobile sur un appareil physique (dev build ou preview)
2. Connectez-vous comme `chloe@test.com` — le token Expo est auto-enregistré côté serveur
3. Ouvrez `http://<api-url>/admin` → Notifications Push
4. Écrivez titre + message → Envoyer

### 4.2 Depuis curl

```bash
# 1. Login admin
TOKEN=$(curl -s -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@beauteducil.com","password":"ChangeMeNow!"}' | jq -r .token)

# 2. Broadcast
curl -X POST http://localhost:4000/api/v1/admin/notifications/push \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","body":"Ceci est une notif de test"}'
```

### 4.3 Depuis l'outil Expo en ligne

Si vous avez le token Expo d'un device (log côté backend ou Prisma Studio → table `PushToken`) :

👉 [https://expo.dev/notifications](https://expo.dev/notifications)

Collez le token, écrivez votre message, envoyez — pratique pour tester sans backend.

### 4.4 Vérifier la réception

Sur l'appareil :
- **iOS** : la notification apparaît sur l'écran de verrouillage + badge sur l'icône
- **Android** : notification dans le tiroir de notifications + son

Si rien n'arrive, vérifiez :
1. Les permissions sont accordées (Paramètres → BDC → Notifications)
2. Le token est bien en base (`SELECT * FROM "PushToken"`)
3. Les credentials APNs/FCM sont uploadés sur EAS (`eas credentials`)
4. Les logs backend : `docker compose logs -f api | grep push`

---

## 5. Debugging mobile

### 5.1 React DevTools

```bash
npx react-devtools
# Puis dans l'app: secouez le device → "Open React DevTools"
```

### 5.2 Network — inspecter les requêtes API

Dans `services/api.ts`, décommentez ou ajoutez temporairement :

```typescript
apiClient.interceptors.request.use((config) => {
  console.log('[API]', config.method?.toUpperCase(), config.url, config.data);
  return config;
});
```

### 5.3 Flipper / Reactotron

Pour un debugging avancé (réseau, storage, layout) :
```bash
npm i -D reactotron-react-native
```

### 5.4 Logs production

`expo-router` + React Native exposent les logs via :
- **EAS** : `eas build:view --logs`
- **iOS** : Console.app → filtrer par votre app
- **Android** : `adb logcat | grep ReactNativeJS`

Pour du vrai monitoring en prod, intégrer **Sentry** :

```bash
cd mobile
npx expo install @sentry/react-native
```

Configurer `sentry.config.ts` et wrapper le root layout — les crashes remontent automatiquement.

---

## 6. Checklist pré-release

- [ ] Tous les écrans testés sur iPhone SE (plus petit) et iPad (plus grand)
- [ ] Login / logout fonctionne, refresh token OK après 15min
- [ ] Push notifications reçues sur device réel (iOS + Android)
- [ ] Boutique : parcours complet produit → détail → retour
- [ ] Espace élèves : dashboard, chat (envoi + réception), documents, profil
- [ ] Masterclass : réservation décrémente `spotsAvailable`, push confirmation reçue
- [ ] Deep link `bdc://` fonctionne (notification tapped → bonne route)
- [ ] Pas de warning `react-native` en console (`npx expo-doctor`)
- [ ] Versions bumpées dans `app.json` (`version` + `buildNumber`/`versionCode`)
- [ ] Changelog à jour pour la soumission store
