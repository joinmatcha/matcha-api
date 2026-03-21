############################
# Stage: dev (hot reload)  #
############################
FROM node:22.16.0-alpine AS dev
WORKDIR /app
RUN corepack enable

# Installe les deps du repo API
COPY package.json ./
RUN yarn install

# Code source
COPY . .

EXPOSE 3000
# Dev: ts-node-dev (défini dans package.json de l'API)
CMD ["yarn", "dev"]


#################################
# Stage: builder (TypeScript -> JS)
#################################
FROM node:22.16.0-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY package.json ./
RUN yarn install
COPY . .
RUN yarn build   # produit ./dist


#################################
# Stage: production (runtime léger)
#################################
FROM node:22.16.0-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
RUN corepack enable

# Dépendances prod uniquement
COPY package.json ./
RUN yarn install --production

# Copie du build
COPY --from=builder /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/index.js"]
