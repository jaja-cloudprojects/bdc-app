# Architecture technique

Ce document décrit les flux critiques de l'application : authentification, push notifications, upload, et organisation du code.

## Vue d'ensemble

```
┌─────────────────────┐         HTTPS         ┌──────────────────────┐
│  Mobile (Expo SDK)  │ ◄──────────────────► │  API Express + Prisma │
│  iOS / Android      │     JWT + JSON       │   Node 20              │
└──────────┬──────────┘                      └────────┬─────────────┘
           │                                          │
           │ Expo Push Token                          │
           ▼                                          ▼
   ┌───────────────┐                          ┌──────────────┐
   │ Expo Push API │ ◄─── expo-server-sdk ──── │ PostgreSQL   │
   └───────┬───────┘                          │   16         │
           │ APNs / FCM v1                    └──────────────┘
           ▼
    Device (OS notif)
```

## 1. Authentification (JWT avec refresh)

### Flux login

```
Mobile                   API                    DB
  │                       │                      │
  │──POST /auth/login────►│                      │
  │  {email, password}    │──findUnique(email)──►│
  │                       │◄────user record──────│
  │                       │                      │
  │                       │ bcrypt.compare()     │
  │                       │ signAccessToken(15m) │
  │                       │ signRefreshToken(30d)│
  │◄──{token,refresh,user}│                      │
  │                       │                      │
  │ SecureStore.set(both) │                      │
```

### Flux appel authentifié

Chaque requête attache `Authorization: Bearer <token>`.

Interceptor axios (`services/api.ts`) :
1. Récupère le token via `SecureStore`
2. Attache le header
3. Si `401` → tente `POST /auth/refresh` **une seule fois**
4. Si refresh OK → rejoue la requête originale
5. Si refresh KO → efface tokens + redirige vers login

Côté backend, `middleware/auth.ts` :
- `requireAuth` — vérifie le JWT, attache `req.user`
- `requireAdmin` — vérifie en plus que `role === 'ADMIN'`

### Pourquoi deux tokens ?

| Token | Durée | Stocké | Usage |
|---|---|---|---|
| Access | 15 min | SecureStore | Chaque requête API |
| Refresh | 30 jours | SecureStore | Obtenir un nouveau access token |

Si quelqu'un vole un access token, il n'est valable que 15 min. Le refresh token, utilisé une seule fois par session active, limite fortement la fenêtre d'attaque.

---

## 2. Push notifications

### Enregistrement du token device

Après chaque login réussi (`contexts/AuthContext.tsx`) :

```typescript
login() → registerForPushNotificationsAsync()
         → 1. Demande permission OS (iOS popup / Android silencieux)
         → 2. getExpoPushTokenAsync(projectId)
         → 3. POST /auth/push-token {token, platform}
         → 4. Backend: prisma.pushToken.upsert()
```

### Envoi d'une notification

Déclenché par :
- Admin via `/admin` → broadcast à tous
- Action backend (ex: nouvelle news → auto-broadcast, réservation → confirmation ciblée)

`services/notification.service.ts` :

```typescript
sendPushToUsers([userId], { title, body, data })
  │
  ├─► SELECT * FROM PushToken WHERE userId IN (...)
  ├─► expo.chunkPushNotifications(messages)  // ≤100 par batch
  ├─► expo.sendPushNotificationsAsync(chunk)
  │
  └─► Si ticket.status === 'error' + DeviceNotRegistered:
         DELETE FROM PushToken WHERE id = ...  // auto-cleanup
```

### Côté mobile — gérer la réception

Dans le root layout (à ajouter si besoin d'intercepter) :

```typescript
import { addNotificationListeners } from '@/services/notifications';
import { router } from 'expo-router';

useEffect(() => {
  return addNotificationListeners({
    onTapped: (response) => {
      const { type, id } = response.notification.request.content.data;
      if (type === 'news') router.push(`/news/${id}`);
      if (type === 'reservation') router.push('/(student)/practical-sheets');
    },
  });
}, []);
```

---

## 3. Upload de fichiers

### Flux admin uploade une image produit

```
Admin Panel                  API                    Disk
    │                         │                      │
    │──POST /admin/upload────►│                      │
    │  FormData (file)        │ multer.diskStorage() │
    │                         │──write file──────────►│
    │                         │                      │
    │◄──{url, filename,...}───│                      │
    │                         │                      │
    │ Upload URL utilisée     │                      │
    │ dans POST /products     │                      │
    │ {imageUrl: "..."}       │                      │
```

Les fichiers sont stockés dans `./uploads/` (volume Docker persistant en prod) et servis publiquement via `/uploads/<filename>`.

### Limites

- Taille max : 10 MB (variable `MAX_FILE_SIZE`)
- Types : jpg, png, webp, gif, pdf, doc, docx, xls, xlsx
- **Pas de CDN** par défaut — pour passer à grande échelle, migrer vers S3 + CloudFront

### Migration vers S3 (si besoin plus tard)

Remplacer `multer.diskStorage` par `multer-s3` :

```typescript
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';

const s3 = new S3Client({ region: 'eu-west-3' });
const storage = multerS3({
  s3,
  bucket: 'bdc-uploads',
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (_req, file, cb) => cb(null, `uploads/${Date.now()}-${file.originalname}`),
});
```

---

## 4. Structure du code

### Mobile (`mobile/`)

```
app/                        Expo Router — file-based routing
├── _layout.tsx             Root: providers (Auth, QueryClient, SafeArea)
├── index.tsx               Home (Boutique) — écran 1
├── academy.tsx             Academy — écran 6
├── (auth)/
│   └── login.tsx           Login Espace Élèves — écran 3
├── (student)/              Routes protégées par auth guard
│   ├── _layout.tsx         Redirect vers /login si pas authentifié
│   ├── dashboard.tsx       Dashboard — écran 4
│   ├── chat.tsx            Chat BDC Bot — écran 5
│   ├── documents.tsx
│   ├── profile.tsx
│   ├── help.tsx
│   └── practical-sheets.tsx
└── boutique/
    ├── _layout.tsx
    ├── index.tsx
    ├── category/[slug].tsx  Dynamic route
    └── product/[id].tsx

components/                 Composants réutilisables
├── Logo, Header, DrawerMenu
├── Button, Input
├── ProductCard, CategoryCircle, ActionTile
├── ChatBubble
└── StudentPageScaffold

constants/                  Design system
├── Colors.ts               Palette extraite de la maquette Figma
├── Typography.ts           Fonts (Playfair + Cormorant + Inter) + tailles
└── Layout.ts               Breakpoints, spacing, radius, elevation

hooks/
└── useResponsive.ts        Hook central phone-sm → tablet-lg

services/
├── api.ts                  Axios + interceptors + types + endpoints
└── notifications.ts        Expo push registration + listeners

contexts/
└── AuthContext.tsx         user, login, logout, refresh
```

### Backend (`backend/`)

```
src/
├── index.ts                Express app — middleware, routes, boot
├── seed.ts                 Données initiales
├── config/
│   ├── env.ts              Typage + fallbacks des variables d'env
│   └── database.ts         Instance PrismaClient
├── middleware/
│   ├── auth.ts             requireAuth / requireAdmin
│   ├── error.ts            errorHandler global (Zod + Prisma P-codes)
│   └── upload.ts           multer.diskStorage
├── utils/
│   └── jwt.ts              sign/verify access + refresh
├── routes/
│   ├── auth.routes.ts      login, refresh, me, logout, push-token
│   ├── products.routes.ts  GET (list, newest, byId)
│   ├── categories.routes.ts
│   ├── news.routes.ts
│   ├── masterclass.routes.ts   + reservation atomique
│   ├── chat.routes.ts      conversations + messages
│   ├── documents.routes.ts
│   └── admin.routes.ts     CRUD + push broadcast + upload
└── services/
    └── notification.service.ts    expo-server-sdk wrapper

prisma/
└── schema.prisma           11 modèles

admin/public/
└── index.html              Panel admin (HTML/CSS/JS vanilla, zéro build)
```

---

## 5. Responsive — comment l'app s'adapte

Le hook `useResponsive` classe le device en 5 catégories :

```
phone-sm    < 380px    iPhone SE
phone       380-768    iPhone standard / Pro
tablet-sm   768-1024   iPad mini portrait
tablet      1024px+ portrait   iPad Pro
desktop     1024px+ landscape
```

Chaque écran utilise `scale({ phoneSm, phone, tablet, ... })` pour changer :
- Tailles de police (hero `ESPACE` : 52px → 92px)
- Paddings latéraux (16 → 32)
- Hauteurs de hero images (200 → 300)
- Nombre de colonnes en grille (2 → 4)

Les layouts sont centrés avec `maxWidth: MaxContentWidth` (1100px) sur tablette landscape pour éviter des lignes de texte trop longues.

---

## 6. Flux de réservation masterclass (exemple complet)

Illustre un cas qui touche presque toute la stack.

```
1. Élève ouvre /(student)/practical-sheets
   ├─ useQuery(['masterclass','upcoming']) → GET /masterclass/upcoming
   └─ Affiche liste + bouton "Réserver"

2. Élève clique "Réserver"
   ├─ useMutation → POST /masterclass/:id/reserve
   │
   └─ Backend:
      ├─ prisma.$transaction()
      │    ├─ Check no duplicate reservation
      │    ├─ UPDATE masterclass SET spotsAvailable -= 1
      │    └─ INSERT reservation
      │
      ├─ sendPushToUsers([userId], { title: 'Réservation confirmée', ... })
      │    └─ Expo Push API → APNs/FCM → Device
      │
      └─ Return reservation

3. Mobile:
   ├─ Alert "Réservation confirmée"
   ├─ invalidateQueries(['masterclass']) → refetch la liste
   └─ Push arrive sur le device (même dispositif ou autres du user)
```

C'est un bon exemple du pattern utilisé partout : validation Zod en entrée, transaction Prisma pour la cohérence, push asynchrone non-bloquant, invalidation de cache TanStack Query côté mobile.
