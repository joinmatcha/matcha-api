# matcha-api

API REST pour Matcha, application mobile d'aide à la reconversion professionnelle.

## Stack technique

- **Runtime** : Node.js 22.16.0
- **Framework** : Express.js
- **Langage** : TypeScript
- **Base de données** : MongoDB (Mongoose)
- **Authentification** : JWT
- **Envoi d'emails** : Nodemailer (SMTP Gmail)
- **Upload d'images** : Cloudinary
- **Documentation API** : Swagger (accessible sur `/api-docs`)

## Prérequis

- [Node.js](https://nodejs.org/) 22.16.0 (voir `.nvmrc`)
- [Yarn](https://classic.yarnpkg.com/) 1.22.x
- [Docker](https://www.docker.com/) et Docker Compose

## Installation

```bash
git clone git@github.com:joinmatcha/matcha-api.git
cd matcha-api
yarn install
cp .env.example .env
```

Remplacer les valeurs préfixées `BW_` par les vrais secrets disponibles sur le **Bitwarden de l'organisation Matcha** (compte `matcha.api.gpe@gmail.com`).

## Lancement en local

### Avec MongoDB local (Docker)

Démarre MongoDB puis l'API avec hot reload :

```bash
yarn dev
```

### API seule (si MongoDB tourne déjà)

```bash
yarn dev:api
```

### Stack complète via Docker Compose

API + MongoDB :

```bash
yarn docker:dev
```

API + MongoDB + cron de nettoyage des utilisateurs non vérifiés :

```bash
yarn docker:cleanup
```

Arrêter tous les conteneurs :

```bash
yarn down
```

## Variables d'environnement

| Variable                             | Description                                            | Valeur par défaut       | Sensible |
| ------------------------------------ | ------------------------------------------------------ | ----------------------- | -------- |
| `PORT`                               | Port du serveur                                        | `3000`                  | Non      |
| `MONGODB_URI`                        | Connection string MongoDB                              | -                       | Oui      |
| `MONGODB_DB`                         | Nom de la base de données                              | `matcha`                | Non      |
| `APP_NAME`                           | Nom de l'application                                   | `matcha-api`            | Non      |
| `NODE_ENV`                           | Environnement (`development`, `test`, `production`)    | `development`           | Non      |
| `CLIENT_URL`                         | URL du client (CORS)                                   | `*`                     | Non      |
| `DAILY_SWIPE_LIMIT`                  | Nombre de swipes autorisés par utilisateur et par jour | `10`                    | Non      |
| `API_URL`                            | URL publique de l'API                                  | `http://localhost:3000` | Non      |
| `FRONTEND_URL`                       | URL du frontend (liens dans les emails)                | `http://localhost:8081` | Non      |
| `JWT_SECRET`                         | Clé de signature des tokens JWT                        | -                       | Oui      |
| `SMTP_HOST`                          | Serveur SMTP                                           | `smtp.gmail.com`        | Non      |
| `SMTP_PORT`                          | Port SMTP                                              | `587`                   | Non      |
| `SMTP_USER`                          | Adresse email d'envoi                                  | -                       | Non      |
| `SMTP_PASS`                          | Mot de passe d'application Gmail                       | -                       | Oui      |
| `CLOUDINARY_URL`                     | URL de connexion Cloudinary                            | -                       | Oui      |
| `CLOUDINARY_CLOUD_NAME`              | Nom du cloud Cloudinary                                | -                       | Non      |
| `CLOUDINARY_API_KEY`                 | Clé API Cloudinary                                     | -                       | Oui      |
| `CLOUDINARY_API_SECRET`              | Secret API Cloudinary                                  | -                       | Oui      |
| `INITIAL_ADMIN_EMAIL`                | Email de l'admin initial (créé au démarrage)           | -                       | Non      |
| `INITIAL_ADMIN_PASSWORD`             | Mot de passe de l'admin initial                        | -                       | Oui      |
| `INITIAL_ADMIN_FIRST_NAME`           | Prénom de l'admin initial                              | `Admin`                 | Non      |
| `INITIAL_ADMIN_LAST_NAME`            | Nom de l'admin initial                                 | `Matcha`                | Non      |
| `INITIAL_ADMIN_FORCE_PASSWORD_RESET` | Forcer la réinitialisation du mot de passe admin       | `false`                 | Non      |
| `ROME_CLIENT_ID`                     | Client ID France Travail ROME                          | -                       | Oui      |
| `ROME_CLIENT_SECRET`                 | Client secret France Travail ROME                      | -                       | Oui      |
| `ROME_TOKEN_URL`                     | URL OAuth France Travail                               | URL partenaire          | Non      |
| `ROME_METIERS_API_URL`               | Base URL API ROME métiers                              | URL partenaire          | Non      |
| `ROME_FICHES_METIERS_API_URL`        | Base URL API ROME fiches métiers                       | URL partenaire          | Non      |
| `ROME_SCOPES`                        | Scopes OAuth ROME                                      | Métiers                 | Non      |
| `ROME_REQUEST_DELAY_MS`              | Délai entre deux appels ROME                           | `1100`                  | Non      |
| `ROME_FETCH_FICHES`                  | Récupérer aussi les fiches métier détaillées           | `true`                  | Non      |
| `ROME_SYNC_MODE`                     | Mode de sync ROME (`summary`, `details`, `full`)       | `full`                  | Non      |
| `MARKET_STATS_API_URL`               | Base URL API Marché du travail France Travail          | URL partenaire          | Non      |
| `MARKET_STATS_SCOPES`                | Scopes OAuth Marché du travail                         | Stats offres/demandes   | Non      |
| `MARKET_STATS_REQUEST_DELAY_MS`      | Délai entre appels Marché du travail                   | `250`                   | Non      |
| `MARKET_STATS_TERRITORY_TYPE`        | Type de territoire des stats marché                    | `NAT`                   | Non      |
| `MARKET_STATS_TERRITORY_CODE`        | Code territoire des stats marché                       | `FR`                    | Non      |
| `MARKET_STATS_SYNC_LIMIT`            | Limite optionnelle de métiers pour tester la sync      | -                       | Non      |

Les valeurs sensibles sont stockées sur **Bitwarden** (organisation Matcha).

## Base de données

### Chargement des variables d'environnement

L'API utilise un mécanisme de chargement conditionnel du fichier `.env` :

- `NODE_ENV=development` → charge `.env.development` (MongoDB Atlas distant)
- Sinon → charge `.env` (production ou test)

Ce mécanisme est défini dans `src/index.ts` et répliqué dans chaque script de seed.

### Environnements

| Environnement       | Base de données | Source                                   |
| ------------------- | --------------- | ---------------------------------------- |
| Local (Docker)      | `matcha_dev`    | MongoDB local (`localhost:27017`)        |
| Development (Atlas) | `matcha_dev`    | MongoDB Atlas (cluster `matcha-cluster`) |
| Test                | `matcha_test`   | MongoDB local (`localhost:27017`)        |
| Production          | `matcha_dev`    | MongoDB Atlas (cluster `matcha-cluster`) |

### Collections

| Collection             | Description                                          |
| ---------------------- | ---------------------------------------------------- |
| `users`                | Comptes utilisateurs                                 |
| `jobs`                 | Catalogue des métiers                                |
| `personalitytemplates` | Templates de test de personnalité                    |
| `personalitytests`     | Résultats des tests de personnalité                  |
| `bilanquestions`       | Questions du bilan de compétences                    |
| `bilancompetences`     | Référentiel de compétences                           |
| `bilananswersets`      | Réponses aux bilans                                  |
| `skillsassessments`    | Évaluations de compétences                           |
| `recommendations`      | Recommandations de métiers                           |
| `swipes`               | Historique des swipes (like/dislike sur les métiers) |
| `chatsessions`         | Sessions de chat                                     |
| `cvparsings`           | Résultats de parsing de CV                           |
| `logfeedbacks`         | Logs de feedback utilisateur                         |

## Seeds

Les seeds permettent de peupler la base de données avec les données de référence nécessaires au fonctionnement de l'application.

### Quand lancer les seeds ?

- Au **premier déploiement** (base vide)
- Après un **reset de la base de données**
- Lors de la mise à jour des référentiels de tests/bilans

### Sur MongoDB Atlas (distant)

```bash
NODE_ENV=development yarn seed:personality
NODE_ENV=development yarn seed:bilan
NODE_ENV=development yarn sync:rome
```

### Sur MongoDB local

```bash
yarn seed:personality
yarn seed:bilan
yarn sync:rome
```

### Détail des scripts

| Script                  | Description                                  |
| ----------------------- | -------------------------------------------- |
| `yarn seed:personality` | Peuple les templates de test de personnalité |
| `yarn seed:bilan`       | Peuple les questions et compétences du bilan |

### Autres scripts utilitaires

| Script                       | Description                                                   |
| ---------------------------- | ------------------------------------------------------------- |
| `yarn admin:promote <email>` | Promeut un utilisateur existant en admin                      |
| `yarn reset:swipes`          | Supprime tous les swipes (utile en phase de test)             |
| `yarn cleanup:users`         | Supprime les utilisateurs non vérifiés dont le token a expiré |
| `yarn sync:rome`             | Synchronise les métiers ROME depuis France Travail            |
| `yarn sync:rome:cron`        | Lance le scheduler mensuel de synchronisation ROME            |
| `yarn sync:market`           | Synchronise les statistiques Marché du travail par métier     |
| `yarn remap:market`          | Recalcule les stats normalisées depuis le `raw` déjà importé  |

## Synchronisation ROME

L'API stocke localement le référentiel ROME France Travail pour éviter de dépendre des appels externes dans les parcours utilisateur.

Collections principales :

| Collection         | Description                                                  |
| ------------------ | ------------------------------------------------------------ |
| `romemetiers`      | Métiers ROME normalisés, un document par code métier ROME    |
| `romeappellations` | Appellations/alias dédiés à la recherche et l'autocomplétion |
| `romemarketstats`  | Statistiques marché par métier ROME et territoire            |
| `romesyncruns`     | Historique, statut, progression et erreurs des imports ROME  |

La synchronisation complète :

1. Récupère un token OAuth France Travail.
2. Liste les appellations ROME.
3. Déduplique par code métier.
4. Récupère le détail métier, puis la fiche métier si disponible.
5. Upsert les métiers et appellations.
6. Désactive les données absentes uniquement à la fin d'un run complet.

La contrainte France Travail `1 appel / seconde` est respectée via `ROME_REQUEST_DELAY_MS` (`1100` ms par défaut).

Pour un premier import rapide, utiliser :

```env
ROME_SYNC_MODE=summary
ROME_FETCH_FICHES=false
```

Ce mode ne fait que l'appel de liste des appellations, déduplique les métiers, remplit `romemetiers` avec les informations disponibles dans la liste, puis remplit `romeappellations`. Les modes plus riches sont :

| Mode      | Appels effectués                                      | Usage recommandé                      |
| --------- | ----------------------------------------------------- | ------------------------------------- |
| `summary` | Liste appellations uniquement                         | Premier import rapide / validation BO |
| `details` | Liste appellations + détail de chaque métier          | Enrichissement métier sans fiches     |
| `full`    | Liste appellations + détail métier + fiche si activée | Import complet mensuel                |

Endpoints back-office :

| Endpoint                            | Description                                  |
| ----------------------------------- | -------------------------------------------- |
| `POST /api/admin/rome/sync`         | Lance une synchronisation ROME manuelle      |
| `GET /api/admin/rome/status`        | Statut courant, dernier run, totaux importés |
| `GET /api/admin/rome/sync-runs`     | Historique paginé des synchronisations       |
| `GET /api/admin/rome/sync-runs/:id` | Détail d'une synchronisation                 |

## Synchronisation Marché du travail

L'API Marché du travail enrichit les fiches ROME avec les indicateurs France Travail par code ROME et territoire : salaires en poste (`SAL_3`), offres (`OFF_1`), embauches (`EMB_1`), demandeurs (`DE_1`) et tension de recrutement (`PERSP_2`).

```bash
yarn sync:market
```

Pour tester sur un petit volume :

```bash
yarn sync:market --limit=10
```

Par défaut, les données sont récupérées au niveau national (`MARKET_STATS_TERRITORY_TYPE=NAT`, `MARKET_STATS_TERRITORY_CODE=FR`) et stockées dans `romemarketstats`. Le détail métier `GET /api/jobs/:id` expose ensuite un champ `job.market` sans le `raw` technique.

Après une évolution du mapper, il est possible de recalculer les champs normalisés sans rappeler l'API France Travail :

```bash
yarn remap:market
```

## Build et déploiement

### Build

La compilation TypeScript se fait en deux étapes :

1. `tsc` — compile le TypeScript en JavaScript dans `./dist`
2. `tsc-alias` — résout les alias de chemins (`@/` → `src/`) dans le code compilé

```bash
yarn build
```

### Dockerfile

Le Dockerfile utilise un **multi-stage build** avec 3 étapes :

| Stage        | Base                  | Rôle                                                             |
| ------------ | --------------------- | ---------------------------------------------------------------- |
| `dev`        | `node:22.16.0-alpine` | Développement avec hot reload (`yarn dev`)                       |
| `builder`    | `node:22.16.0-alpine` | Compilation TypeScript → JavaScript                              |
| `production` | `node:22.16.0-alpine` | Runtime léger, dépendances prod uniquement, `node dist/index.js` |

Un second Dockerfile (`cron.Dockerfile`) existe pour le service de nettoyage des utilisateurs non vérifiés.

### Déploiement sur Render

- **URL** : https://matcha-api-4eme.onrender.com
- **Repo** : `joinmatcha/matcha-api`, branche `mvp-144`
- **Runtime** : Docker (target `production`)
- **Plan** : Free (l'instance s'éteint après 15 min d'inactivité, le premier appel peut prendre ~30s)
- **Variables d'environnement** : configurées directement dans le dashboard Render

Le déploiement se déclenche automatiquement à chaque push sur la branche `mvp-144`.

## Scripts

| Script                       | Description                                               |
| ---------------------------- | --------------------------------------------------------- |
| `yarn dev`                   | Démarre MongoDB (Docker) puis l'API avec hot reload       |
| `yarn dev:api`               | Démarre l'API seule (MongoDB doit tourner)                |
| `yarn build`                 | Compile TypeScript vers `dist/` avec résolution des alias |
| `yarn start`                 | Lance l'API compilée (`node dist/index.js`)               |
| `yarn lint`                  | Vérifie le code avec ESLint                               |
| `yarn lint:fix`              | Corrige automatiquement les erreurs ESLint                |
| `yarn format`                | Formate le code avec Prettier                             |
| `yarn test`                  | Exécute les tests Jest                                    |
| `yarn test:coverage`         | Exécute les tests avec rapport de couverture              |
| `yarn seed:personality`      | Peuple les templates de personnalité                      |
| `yarn seed:bilan`            | Peuple les données du bilan                               |
| `yarn admin:promote <email>` | Promeut un utilisateur en admin                           |
| `yarn reset:swipes`          | Supprime tous les swipes                                  |
| `yarn cleanup:users`         | Supprime les utilisateurs non vérifiés expirés            |
| `yarn mongo:start`           | Démarre MongoDB seul via Docker                           |
| `yarn mongo:stop`            | Arrête MongoDB                                            |
| `yarn mongo:logs`            | Affiche les logs MongoDB                                  |
| `yarn docker:dev`            | Démarre API + MongoDB via Docker Compose                  |
| `yarn docker:cleanup`        | Démarre API + MongoDB + cron via Docker Compose           |
| `yarn down`                  | Arrête tous les conteneurs                                |

## CI/CD

Une GitHub Action (`.github/workflows/ci.yml`) s'exécute sur chaque push et pull request vers `main` et `develop1`.

### Pipeline

1. **Install** — `yarn install --frozen-lockfile`
2. **Lint** — `yarn lint`
3. **Tests** — `yarn test:coverage`
4. **Build** — `yarn build`
5. **Coverage** — génère un rapport de couverture, publié en commentaire sur la PR

Si le lint ou les tests échouent, le build ne passe pas.

## Architecture du projet

```
src/
├── index.ts          # Point d'entrée, chargement dotenv, démarrage serveur
├── app.ts            # Configuration Express (middlewares, routes, CORS)
├── config/           # Configuration (env, base de données, Swagger)
├── constants/        # Constantes de l'application
├── middlewares/       # Middlewares Express (auth, validation, etc.)
├── models/           # Modèles Mongoose (schémas MongoDB)
├── modules/          # Modules métier (routes + contrôleurs)
├── scripts/          # Scripts CLI (seeds, admin, cleanup)
├── seeds/            # Données de seed (jobs, personnalité, bilan)
├── services/         # Logique métier (email, matching, etc.)
├── tests/            # Tests Jest
├── types/            # Types TypeScript partagés
└── utils/            # Fonctions utilitaires
```

## Accès aux services

| Service                             | URL                                           | Connexion                                    |
| ----------------------------------- | --------------------------------------------- | -------------------------------------------- |
| **Render** (hébergement API)        | https://dashboard.render.com                  | Google (`matcha.api.gpe@gmail.com`)          |
| **MongoDB Atlas** (base de données) | https://cloud.mongodb.com                     | Google (`matcha.api.gpe@gmail.com`)          |
| **Expo** (build mobile)             | https://expo.dev                              | Identifiants sur Bitwarden                   |
| **GitHub** (code source)            | https://github.com/joinmatcha                 | Compte personnel (organisation `joinmatcha`) |
| **Bitwarden** (secrets)             | https://vault.bitwarden.eu                    | Google (`matcha.api.gpe@gmail.com`)          |
| **Swagger** (documentation API)     | https://matcha-api-4eme.onrender.com/api-docs | -                                            |

### Back-office admin

Les routes du back-office sont exposées sous `/api/admin`.

1. Se connecter : `POST /api/admin/auth/login` pour obtenir un JWT admin
2. Utiliser le header `Authorization: Bearer <token>` sur les requêtes suivantes
3. La documentation complète est disponible sur `/api-docs`

Deux méthodes pour créer un premier admin :

- Via le script CLI : `yarn admin:promote user@example.com`
- Automatiquement au démarrage via les variables `INITIAL_ADMIN_*` (voir section Variables d'environnement)
