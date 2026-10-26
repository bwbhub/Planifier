# @planifier/db

Schéma Prisma 7 (PostgreSQL), migrations, client et seed. Aucune fonction propre à l'hébergeur (ADR 0005).

## API publique

`getDb()` : client Prisma unique du processus. Importé par `api` et `auth` uniquement ; le lint l'interdit au web
(`SERVER_PACKAGES`). Pas de `server-only` : `apps/api` est du Node pur, sans la condition `react-server`.

## Commandes

Base locale : `docker compose up -d` (racine, PostgreSQL 17 sur `127.0.0.1:5433`), puis copier `.env.example` vers
`packages/db/.env.local`.

| Commande                                     | Effet                                               |
| -------------------------------------------- | --------------------------------------------------- |
| `pnpm --filter @planifier/db generate`       | client Prisma (aussi via Turbo)                     |
| `pnpm --filter @planifier/db migrate:dev`    | crée et applique une migration en local             |
| `pnpm --filter @planifier/db migrate:deploy` | applique les migrations (environnements partagés)   |
| `pnpm --filter @planifier/db seed`           | données de démo, idempotent, base locale uniquement |
| `pnpm seed` (racine)                         | seed de `db` puis mots de passe de démo (`auth`)    |

`generate`, `validate` et `format` n'ouvrent aucune connexion et n'exigent aucune URL. La CLI lit `.env.local`
s'il existe (`getCliDatabaseUrl()` dans `src/env.ts`).

Le seed refuse toute base dont l'hôte n'est pas `localhost`, `127.0.0.1` ou `[::1]`, et `NODE_ENV=production`
(`assertLocalDatabase`). `@planifier/db/seeding` expose `DEMO_USERS` et `openLocalSeedDatabase()` (même garde) au
seed de `auth`, qui pose les mots de passe : `db` ne dépend pas de Better Auth.

## Tests d'intégration

`@planifier/db/testing` : `createTestDatabase()` rend `{ db, reset }` sur `DATABASE_URL`, refusé hors d'une base
locale dont le nom finit par `_test` (`assertTestDatabase`) ; `reset()` vide toutes les tables de cette même base
(historique des migrations gardé). Préparer la base une fois :

```
docker compose exec postgres createdb -U planifier planifier_test
DATABASE_URL_UNPOOLED=postgresql://planifier:planifier@localhost:5433/planifier_test pnpm --filter @planifier/db migrate:deploy
```

## Neon (connexions)

| Variable                | Usage                                      | Neon                             |
| ----------------------- | ------------------------------------------ | -------------------------------- |
| `DATABASE_URL`          | client (`getDb()`) et seed                 | connexion **poolée** (`-pooler`) |
| `DATABASE_URL_UNPOOLED` | CLI Prisma (`migrate`, `prisma.config.ts`) | connexion **directe**            |

`DATABASE_URL_UNPOOLED` n'est lue que pour la CLI Prisma (`prisma.config.ts`, via `getCliDatabaseUrl()`) : le client
n'utilise que `DATABASE_URL`. Source : guide Neon + Prisma. Non testé contre un vrai Neon (pas d'accès aux environnements partagés) : à vérifier au
premier déploiement. Un autre hébergeur PostgreSQL fonctionne en mettant la même URL dans les deux variables.

## Client généré

`src/generated` (client Prisma) est ignoré par git et produit par la tâche Turbo `generate`, dont dépendent `build`, `lint`, `check-types`, `test` et `dev`. Ne jamais les éditer.

## Règles

- Pas de Zod généré depuis Prisma : les schémas d'entrée et de sortie de l'API s'écrivent à la main dans
  `api-contract` (DTO), jamais un modèle brut en sortie.
- Une migration par PR, relue, compatible avec l'ancienne version. Jamais `db push` ni `reset` sur un environnement
  partagé (`database-prisma`).
- Les enums sont les miroirs de `@planifier/constants` : modifier les deux ensemble.
- `spaceId` nullable sur toute ressource partageable : `null` = personnel et privé (ADR 0009).
- E-mails en minuscules (contrainte `CHECK` dans la migration) : normaliser avant d'écrire.
- Client unique rangé sur `globalThis` : survit au rechargement à chaud de `next dev`.

## Interdits

Importer ce package depuis `apps/web`. Lire `process.env` hors `src/env.ts`.
