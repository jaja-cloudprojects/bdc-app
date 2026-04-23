# Changelog — BDC App

## [2026-04-23] — Sprint complet : Masterclasses, Notifications, Supabase, Animations

### Dashboard admin

#### Masterclasses
- **Liste des inscrits** : chaque masterclass affiche le nombre d'inscrits avec un bouton cliquable ouvrant un modal détaillé (nom, email, date d'inscription)
- **Retrait d'un étudiant** : bouton « Retirer » dans le modal — supprime la réservation en transaction atomique et restitue la place disponible, mise à jour instantanée du dashboard et de l'application
- **Labels "Slug" francisés** : remplacés par "Identifiant URL" dans les formulaires Produits et Catégories

#### Notifications push
- **Envoi push activé** : le bouton « Envoyer à tous les appareils » est désormais fonctionnel (broadcast via Expo Push Notifications)
- **Campagnes de notifications** : nouveau système de campagnes planifiées avec :
  - Type **Unique** : envoi à une date et heure précises
  - Type **Récurrente** : envoi automatique selon une expression cron (quotidien, hebdomadaire, mensuel, vendredi soir, ou expression personnalisée)
  - Actions disponibles : Envoyer maintenant, Activer / Mettre en pause, Supprimer
  - Historique des envois (compteur + date du dernier envoi)

#### Utilisateurs
- **Photo de profil** : l'avatar Supabase s'affiche dans la bulle de chaque utilisateur — fallback sur l'initiale si aucune photo n'est définie ou si le chargement échoue

#### Corrections
- **`showLogin` manquante** : fonction définie — la page de connexion réapparaît proprement à l'expiration de session au lieu de crasher tout le script

---

### Application mobile

#### Masterclasses — onglet « Fiches pratiques »
- **Deux onglets** : "Masterclasses" et "Mes réservations"
- **Filtrage automatique** : une masterclass déjà réservée disparaît de la liste "Masterclasses" sans rechargement
- **Bouton grisé** : le bouton Réserver est désactivé dès que la réservation est confirmée
- **Onglet "Mes réservations"** : affiche toutes les réservations de l'utilisateur avec date, lieu, statut (Confirmée / Passée) et date d'inscription
- **Annulation** : bouton « Annuler la réservation » sur les masterclasses à venir — confirmation avant annulation, place restituée immédiatement et masterclass réapparaissant dans la liste
- **Badge** : compteur de réservations à venir sur l'onglet "Mes réservations"

#### Animations
- **Transitions de pages** : remplacées par `ios_from_right` — animation native UIKit avec effet parallax, identique au comportement système iOS
- **Boutons (press)** : suppression du `scale` au press, remplacement par une simple atténuation d'opacité (`0.6`) — conforme au comportement iOS natif
- **Cartes produit & catégories** : même correction (scale supprimé, opacité seule)
- **Drawer** : courbes de Bézier alignées sur les courbes iOS (ease-out / ease-in UIKit), durée affinée

---

### Backend

#### Nouvelles routes API
| Route | Description |
|---|---|
| `GET /api/v1/admin/masterclass` | Liste masterclasses avec compteur d'inscrits |
| `GET /api/v1/admin/masterclass/:id/students` | Inscrits d'une masterclass avec infos utilisateur |
| `DELETE /api/v1/admin/masterclass/:id/reservation/:resId` | Retrait d'un étudiant (transaction atomique) |
| `GET /api/v1/masterclass/my-reservations` | Réservations de l'utilisateur connecté |
| `DELETE /api/v1/masterclass/:id/reserve` | Annulation d'une réservation par l'utilisateur |
| `GET /api/v1/admin/campaigns` | Liste des campagnes de notifications |
| `POST /api/v1/admin/campaigns` | Création d'une campagne |
| `PATCH /api/v1/admin/campaigns/:id` | Modification / activation / pause |
| `DELETE /api/v1/admin/campaigns/:id` | Suppression (retire du scheduler) |
| `POST /api/v1/admin/campaigns/:id/send` | Envoi immédiat manuel |

#### Scheduler de campagnes (`campaign.scheduler.ts`)
- Initialisation au démarrage : charge toutes les campagnes récurrentes actives
- Campagnes récurrentes : tâches `node-cron` individuelles par campagne, synchronisées à chaque CRUD
- Campagnes uniques : poll toutes les minutes, envoi automatique à la date planifiée
- Chaque envoi met à jour `lastSentAt` et `sentCount`

#### Sécurité & corrections
- Mot de passe administrateur changé (`ChangeMeNow!` → `BDCAdmin`) dans `.env` et en base de données
- `showLogin` définie côté dashboard pour une gestion propre des sessions expirées

---

### Infrastructure

#### Supabase Storage — avatars
- Upload d'avatar redirigé vers Supabase Storage (bucket `avatars`, public)
- **Compression automatique** via `sharp` avant upload : redimensionnement carré 400×400 px, conversion WebP qualité 82 — typiquement 15–25 Ko contre 200–800 Ko pour un JPEG brut (~10× d'économie)
- Rotation EXIF automatique (photos portrait iPhone orientées correctement)
- `upsert: true` : un seul fichier par utilisateur, pas de doublons
- Cache-bust timestamp sur l'URL publique
- Client Supabase initialisé en lazy (le serveur démarre même si les variables ne sont pas configurées)
- Variables `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_AVATAR_BUCKET` ajoutées à `docker-compose.yml` et `.env.example`

#### Base de données
- Nouveau modèle `NotificationCampaign` : migration `20260423125613_add_notification_campaigns`

#### Dépendances ajoutées
- `node-cron` + `@types/node-cron` — scheduler de campagnes
- `@supabase/supabase-js` — client Supabase Storage
- `sharp` — compression et conversion d'images
