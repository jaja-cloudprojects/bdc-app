# -------- BUILD STAGE --------
FROM node:20-bullseye

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm ci

COPY tsconfig.json ./
COPY src ./src

# 🔑 important pour Prisma
RUN apt-get update && apt-get install -y openssl

RUN npx prisma generate
RUN npm run build

# -------- RUNNER STAGE --------
FROM node:20-bullseye AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

# 🔑 indispensable aussi ici
RUN apt-get update && apt-get install -y openssl

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY admin ./admin

RUN mkdir -p uploads

EXPOSE 4000

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
