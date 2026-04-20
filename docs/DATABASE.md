# Base de données

Le backend utilise **PostgreSQL 16** via **Prisma ORM**.

## Modèle de données

Voir `backend/prisma/schema.prisma` pour la définition complète. Vue d'ensemble :

```
User ────┬── PushToken (1:N)       tokens Expo d'un utilisateur
         ├── Conversation (1:N) ── Message (1:N)
         ├── Reservation (N:M) ── Masterclass
         └── Document (1:N)        documents privés

Category ── Product (1:N)           catalogue boutique

NewsItem                            articles/actualités
Notification                        log des push envoyées
```

### Entités principales

| Modèle | Rôle |
|---|---|
| `User` | Compte élève ou admin, email unique, mot de passe haché (bcrypt 10 rounds) |
| `PushToken` | Tokens Expo par device (un user peut avoir plusieurs devices) |
| `Category` / `Product` | Boutique — slug unique, prix, images |
| `NewsItem` | Actualités publiées (déclenche une push broadcast automatique) |
| `Masterclass` | Cours avec `capacity` + `spotsAvailable` décrémenté atomiquement |
| `Reservation` | Lien User ↔ Masterclass, unique par user/cours |
| `Document` | Fichier uploadé (privé si `userId` défini, sinon public) |
| `Conversation` + `Message` | Chat support entre élève et BDC Bot |
| `Notification` | Historique des push broadcasts pour l'admin |

---

## Installation

### Option 1 — Docker (recommandé)

La stack `docker-compose.yml` démarre PostgreSQL + API automatiquement :

```bash
docker compose up -d db          # PostgreSQL seul
docker compose up -d              # DB + API
```

Variables par défaut :
- Host : `localhost:5432`
- User : `bdc_user`
- Password : `bdc_password`
- Database : `bdc_db`

### Option 2 — PostgreSQL local

```bash
# macOS
brew install postgresql@16 && brew services start postgresql@16

# Ubuntu
sudo apt install postgresql-16 postgresql-contrib

# Créer l'utilisateur et la base
sudo -u postgres psql <<EOF
CREATE USER bdc_user WITH PASSWORD 'bdc_password';
CREATE DATABASE bdc_db OWNER bdc_user;
GRANT ALL PRIVILEGES ON DATABASE bdc_db TO bdc_user;
EOF
```

---

## Migrations

### Créer une migration (dev)

Chaque fois qu'on modifie `schema.prisma` :

```bash
cd backend
npm run db:migrate -- --name description_du_changement
# Ex: npm run db:migrate -- --name add_product_tags
```

Prisma génère un fichier SQL versionné dans `prisma/migrations/` qu'on commit dans Git.

### Appliquer les migrations (prod)

```bash
npm run db:deploy
# Équivalent à: npx prisma migrate deploy
```

⚠️ **Jamais `migrate dev` en production** — cette commande peut supprimer des données.

### Reset complet (dev uniquement)

```bash
npx prisma migrate reset
# Drop la BDD, rejoue toutes les migrations, relance le seed
```

### Introspection (sync depuis une BDD existante)

```bash
npx prisma db pull
# Met à jour schema.prisma à partir de la BDD actuelle
```

---

## Seed (données initiales)

```bash
npm run db:seed
```

Crée :
- 1 admin (`admin@beauteducil.com`)
- 1 élève de démo (`chloe@test.com` / `password123`)
- 4 catégories, 3 produits
- 1 article d'actualité
- 2 masterclasses à venir

Le seed est **idempotent** (via `upsert`) — on peut le rejouer sans casser les données existantes.

---

## Prisma Studio — interface graphique

```bash
npm run db:studio
# Ouvre http://localhost:5555
```

Permet de parcourir/modifier les données sans SQL.

---

## Backup & restauration

### Backup manuel

```bash
# Export complet
docker compose exec db pg_dump -U bdc_user bdc_db > backup_$(date +%F).sql

# Ou sans Docker
pg_dump -U bdc_user -h localhost bdc_db > backup.sql
```

### Restauration

```bash
docker compose exec -T db psql -U bdc_user bdc_db < backup.sql
```

### Backup automatique (production)

Créer un cron quotidien sur le VPS :

```bash
# /etc/cron.d/bdc-backup
0 3 * * * root /opt/bdc/scripts/backup.sh
```

Script `scripts/backup.sh` :

```bash
#!/bin/bash
set -e
BACKUP_DIR=/var/backups/bdc
mkdir -p $BACKUP_DIR
FILE=$BACKUP_DIR/bdc-$(date +%F-%H%M).sql.gz

docker compose -f /opt/bdc/docker-compose.yml exec -T db \
  pg_dump -U bdc_user bdc_db | gzip > $FILE

# Conserver 30 jours
find $BACKUP_DIR -name "bdc-*.sql.gz" -mtime +30 -delete

# Optionnel — envoyer vers S3 / Backblaze
# aws s3 cp $FILE s3://bdc-backups/
```

### Services managés

Si vous utilisez un Postgres managé (Railway, Render, Supabase, Neon, DO), les snapshots quotidiens sont généralement inclus. Vérifiez la rétention et testez une restauration au moins une fois par trimestre.

---

## Performance

### Index existants

Définis dans `schema.prisma` via `@@index` :
- `User.email` — login lookup
- `PushToken.userId` — push fan-out
- `Product.categoryId`, `Product.isNew` — filtres catalogue
- `Masterclass.date` — tri chronologique
- `Message.conversationId` — histoire du chat

### À surveiller (production)

```sql
-- Top requêtes lentes
SELECT query, calls, mean_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;

-- Taille des tables
SELECT relname, pg_size_pretty(pg_total_relation_size(relid))
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC;
```

Activez `pg_stat_statements` dans `postgresql.conf` :
```
shared_preload_libraries = 'pg_stat_statements'
```

### Pool de connexions

Prisma utilise un pool de 10 connexions par défaut. En production avec plusieurs instances API, on peut ajuster via l'URL :

```
DATABASE_URL=...?connection_limit=20&pool_timeout=30
```

Au-delà de ~50 connexions simultanées, utilisez **PgBouncer** ou **Prisma Accelerate**.

---

## Sécurité

1. **Mots de passe** hashés avec bcryptjs (10 rounds) — jamais stockés en clair
2. **SSL obligatoire** en production : `?sslmode=require` dans `DATABASE_URL`
3. **Utilisateur app ≠ superuser** : créer un rôle avec les permissions minimales
   ```sql
   CREATE USER bdc_app WITH PASSWORD '...';
   GRANT CONNECT ON DATABASE bdc_db TO bdc_app;
   GRANT USAGE ON SCHEMA public TO bdc_app;
   GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO bdc_app;
   GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO bdc_app;
   ```
4. **RLS (Row Level Security)** : pas activé par défaut — Prisma gère les permissions applicatives
5. **Rotation des secrets** : changez `JWT_SECRET` au moins une fois par an (déconnecte tous les users)

---

## Suppression & RGPD

Pour supprimer définitivement un utilisateur :

```typescript
await prisma.user.delete({ where: { id: userId } });
// Les Cascade Delete nettoient: pushTokens, conversations, reservations, documents
```

Pour un export RGPD :

```typescript
const data = await prisma.user.findUnique({
  where: { id: userId },
  include: {
    pushTokens: true,
    conversations: { include: { messages: true } },
    reservations: { include: { masterclass: true } },
    documents: true,
  },
});
```

---

## Debug

### Voir les requêtes SQL générées

Activées automatiquement en dev (via `src/config/database.ts`). Pour désactiver :

```typescript
// Mode silencieux
new PrismaClient({ log: ['error'] });
```

### Erreurs fréquentes

| Erreur | Cause | Solution |
|---|---|---|
| `P1001` | DB injoignable | Vérifier `DATABASE_URL`, réseau, firewall |
| `P2002` | Contrainte unique violée | Trappée par `errorHandler` → 409 |
| `P2025` | Record introuvable | L'ID n'existe pas ou a été supprimé |
| `P3009` | Migration failed | `prisma migrate resolve --applied <name>` |
