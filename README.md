# matcha-api

API REST Node.js/TypeScript pour Matcha, basée sur Express et MongoDB.

## Prerequisites

- Node.js 22.16.0
- Yarn Classic 1.22.x
- Docker et Docker Compose

## Installation

```bash
yarn install
cp .env.example .env
```

## Development

Lancer l'API en local. Cette commande démarre aussi MongoDB via Docker si besoin :

```bash
yarn dev
```

Lancer uniquement l'API locale, sans démarrer MongoDB :

```bash
yarn dev:api
```

Lancer MongoDB via Docker :

```bash
yarn mongo:start
```

Lancer la stack Docker API + Mongo :

```bash
yarn docker:dev
```

Lancer Mongo + API + cron de nettoyage :

```bash
yarn docker:cleanup
```

Arrêter les conteneurs :

```bash
yarn down
```

## Scripts

| Script                     | Description                                 |
| -------------------------- | ------------------------------------------- |
| `yarn dev`                 | Démarre MongoDB puis l'API en local         |
| `yarn dev:api`             | Démarre seulement l'API en local            |
| `yarn build`               | Compile TypeScript vers `dist/`             |
| `yarn start`               | Lance l'API compilée                        |
| `yarn lint`                | Vérifie ESLint                              |
| `yarn test`                | Exécute les tests Jest                      |
| `yarn test:coverage`       | Exécute les tests avec couverture           |
| `yarn cleanup:users`       | Exécute une fois le script de nettoyage     |
| `yarn admin:promote`       | Promeut un utilisateur en administrateur    |
| `yarn migrate:personality` | Migre les anciens templates de personnalité |
| `yarn mongo:start`         | Démarre MongoDB seul                        |
| `yarn docker:dev`          | Démarre MongoDB + API via Docker            |
| `yarn docker:cleanup`      | Démarre MongoDB + API + cron via Docker     |

## Environment variables

Exemple minimal :

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=matcha_dev
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_secret
API_URL=http://localhost:3000
FRONTEND_URL=http://localhost:8081
CLIENT_URL=http://localhost:8081
INITIAL_ADMIN_EMAIL=admin@matcha.local
INITIAL_ADMIN_PASSWORD=ChangeMe123!
INITIAL_ADMIN_FIRST_NAME=Admin
INITIAL_ADMIN_LAST_NAME=Matcha
INITIAL_ADMIN_FORCE_PASSWORD_RESET=false
```

## Back-office admin

Les routes BO sont exposées sous `/api/admin`.

- `POST /api/admin/auth/login` pour obtenir un JWT admin
- utiliser ensuite le header `Authorization: Bearer <token>`
- la doc est disponible dans Swagger sur `/api-docs`

Deux options existent pour créer un premier admin :

```bash
yarn admin:promote user@example.com
```

Ou automatiquement au démarrage via les variables d'environnement :

```env
INITIAL_ADMIN_EMAIL=admin@matcha.local
INITIAL_ADMIN_PASSWORD=ChangeMe123!
INITIAL_ADMIN_FIRST_NAME=Admin
INITIAL_ADMIN_LAST_NAME=Matcha
INITIAL_ADMIN_FORCE_PASSWORD_RESET=false
```

Si `INITIAL_ADMIN_EMAIL` existe déjà, l'utilisateur est promu admin. Le mot de passe n'est réécrit que si `INITIAL_ADMIN_FORCE_PASSWORD_RESET=true`.

## CI

Le repo embarque une GitHub Action locale qui exécute :

- `yarn lint`
- `yarn test:coverage`
- `yarn build`

## Notes

- Les Dockerfiles ont été adaptés pour fonctionner dans ce repo autonome, sans contexte monorepo.
- `data/mongo/` est ignoré pour éviter de reversionner des fichiers Mongo locaux.
