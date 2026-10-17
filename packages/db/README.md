# @planifier/db

Schéma Prisma 7 (PostgreSQL), migrations, client et seed. Aucune fonction propre à l'hébergeur (ADR 0005).

## API publique

`getDb()` : client Prisma unique du processus (module `server-only`). Importé par `api` uniquement.

## Commandes

Base locale : `docker compose up -d` (racine, PostgreSQL 17 sur `127.0.0.1:5433`), puis copier `.env.example` vers
`packages/db/.env.local`.

| Commande                                     | Effet                                               |
| -------------------------------------------- | --------------------------------------------------- |
| `pnpm --filter @planifier/db generate`       | client Prisma (aussi via Turbo)                     |
| `pnpm --filter @planifier/db migrate:dev`    | crée et applique une migration en local             |
| `pnpm --filter @planifier/db migrate:deploy` | applique les migrations (environnements partagés)   |
| `pnpm --filter @planifier/db seed`           | données de démo, idempotent, base locale uniquement |

`generate`, `validate` et `format` n'ouvrent aucune connexion et n'exigent aucune URL. La CLI lit `.env.local`
s'il existe (`getCliDatabaseUrl()` dans `src/env.ts`).

Le seed refuse toute base dont l'hôte n'est pas `localhost`, `127.0.0.1` ou `[::1]`, et `NODE_ENV=production`.

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
