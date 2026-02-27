# matcha-api

**matcha-api** est une API REST robuste construite avec **Node.js**, **TypeScript**, **Express** et **MongoDB Atlas**. Elle est conçue avec une architecture modulaire pour faciliter l’évolutivité, la lisibilité et la maintenance.

---

## Fonctionnalités

- Architecture claire et modulaire
- Connexion à MongoDB via 'mongoose'
- Support Docker pour MongoDB local (volume data/mongo)
- Schémas de validation avec `zod`
- Linting & formatage avec ESLint + Prettier
- Tri automatique des imports (Prettier plugin)
- Tests unitaires avec Jest
- Chargement sécurisé des variables d’environnement avec dotenv
- Structure extensible pour services, middlewares, validations, etc.

---

## Installation

```bash
# Cloner le dépôt
git clone https://github.com/ton-utilisateur/matcha-api.git
cd matcha-api

# Installer les dépendances
yarn install

# Configurer les variables d’environnement
cp .env.example .env
# Remplir .env avec les bonnes valeurs
```

---

## Scripts disponibles

| Script          | Description                                            |
| --------------- | ------------------------------------------------------ |
| `yarn dev`      | Lance le serveur en mode développement (`ts-node-dev`) |
| `yarn build`    | Compile le code TypeScript en JavaScript (`dist/`)     |
| `yarn start`    | Exécute l'app compilée avec Node.js                    |
| `yarn lint`     | Vérifie les erreurs de style avec ESLint               |
| `yarn lint:fix` | Corrige automatiquement les erreurs de lint            |
| `yarn format`   | Formate le code avec Prettier                          |
| `yarn test`     | Lance les tests unitaires avec Jest                    |

---

## Variables d’environnement

Fichier `.env` :

```env
PORT=3000
MONGODB_URI=mongodb://mongo:27017/matcha
APP_NAME=matcha-api
NODE_ENV=development
JWT_SECRET=replace_with_a_long_random_secret
CLIENT_URL=http://localhost:8081
FRONTEND_URL=http://localhost:8081
```

## Checklist pré-déploiement

- Définir un `JWT_SECRET` fort (minimum 32 caractères aléatoires).
- Remplacer toutes les URLs locales (`API_URL`, `FRONTEND_URL`, `CLIENT_URL`) par les URLs publiques.
- Configurer un SMTP réel (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`) et tester les emails de vérification/reset.
- Vérifier que le CORS n’accepte pas `*` en production.
- Vérifier que `NODE_ENV=production` est bien utilisé sur l’API.
- Exécuter `yarn lint` puis `yarn test` avant release.

---

## Structure du projet

```
matcha-api/
├── src/
│   ├── config/          # Connexions (ex: MongoDB)
│   ├── modules/         # API par domaine (route/controller/schema)
│   ├── models/          # Schémas de validation (zod)
│   ├── middlewares/     # Middlewares personnalisés
│   ├── services/        # Services transverses
│   ├── utils/           # Fonctions utilitaires (logs, validations...)
│   ├── tests/           # Tests unitaires (Jest)
│   ├── app.ts           # App Express : routes, middlewares, etc.
│   └── index.ts         # Point d’entrée : DB + server
├── .env
├── .env.example
├── docker-compose.yml
├── Dockerfile
├── eslint.config.js
├── prettier.config.cjs
├── .gitignore
├── tsconfig.json
├── jest.config.cjs
└── README.md
```

---

## Conventions & bonnes pratiques

### 🧱 Structure du code

- **Architecture modulaire par domaine** : `modules/<domaine>/{route,controller,schema}`.
- **Routes** = wiring HTTP uniquement.
- **Controllers** = orchestration, pas de logique métier lourde.
- **Services** = logique transverse/métier réutilisable.
- **Validations** faites avec `zod` dans les `schema.ts` de module.
- **Middlewares** = réutilisables, testables, sans effet de bord.
- **data/mongo** = est un volume Docker permettant de stocker durablement les données MongoDB sur la machine hôte, même en cas de redémarrage du conteneur.

### 🧠 Nommage & code

- Dossiers et fichiers en **kebab-case** : `user.controller.ts`, `auth.routes.ts`
- Classes en **PascalCase**, variables & fonctions en **camelCase**
- Variables d’environnement typées avec `zod`
- Fonctions **unitaires, claires, typées**, pas de `any` non justifié

### 🔍 Lint / format

- Lint obligatoire (ESLint avec config stricte)
- Formatage automatique avec Prettier
- Tri des imports avec `@trivago/prettier-plugin-sort-imports`
- Hook `pre-commit` (Husky) avec `lint-staged` : **pas de commit si erreurs**

### 🧪 Tests

- Un test minimum par controller/service
- Nom des fichiers : `*.test.ts` ou `*.spec.ts`
- Utilisation de **Supertest** pour tester les routes HTTP

### 🛡️ Sécurité & robustesse

- Ne jamais logger d’infos sensibles
- Toujours gérer les erreurs avec le middleware `errorHandler`
- DB connectée avant de lancer l’API (dans `index.ts`)
- Pas de logique dans les routes (juste appel au controller)

### ♻️ Git & CI

- Commits avec convention (`feat:`, `fix:`, `chore:`...)
- Branche `main` = stable, **tests & lint passent en CI**
- CI GitHub Actions dans `.github/workflows/ci.yml`
- Pull requests avec review avant merge

---

## Licence

MIT — libre d’utilisation, de modification et de distribution.
