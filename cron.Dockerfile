# Stage 1: Build
FROM node:22.2.0-alpine AS builder

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN yarn install

COPY . .
RUN yarn build  # génère /dist

# Stage 2: Runtime (plus léger)
FROM node:22.2.0-alpine

WORKDIR /app

RUN corepack enable

COPY package.json ./
RUN yarn install --production

# Copie uniquement les fichiers buildés
COPY --from=builder /app/dist ./dist

CMD ["node", "dist/scripts/cleanup-unverified-users.js"]
