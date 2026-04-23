FROM node:20-alpine
RUN apk add --no-cache openssl
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY admin ./admin

RUN npx prisma generate
RUN mkdir -p uploads

EXPOSE 4000
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx src/index.ts"]
