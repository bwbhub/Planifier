# Récap de session

À remplir **à la fin de chaque session et avant chaque push** : une entrée en haut du fichier (la plus récente d'abord).
Chaque entrée dit ce qui vient d'être fait, ce qui a réellement tourné, ce qui reste ouvert et ce qui est attendu ensuite.
Faits uniquement : ce qui n'a pas été exécuté est écrit comme tel.

Modèle d'entrée :

```
## AAAA-MM-JJ — <sujet> (branche `<nom>`)

**Fait** : …
**Décisions** : … (et pourquoi)
**Vérifié** : commandes réellement exécutées et résultat ; ce qui n'a pas tourné.
**Ouvert** : revues humaines requises, risques, dettes créées.
**Attendu ensuite** : …
```

---

## 2026-10-17 — Package `db` : schéma Prisma 7, migration, seed (branche `feat/package-db`)

**Fait**

- `packages/db` : schéma Prisma 7 (modèles de l'ancien `back/` + Espace, membres, rôles, modules activés ;
  `spaceId` nullable sur `Event`), migration unique `init`, client `getDb()` (singleton, `server-only`), `env.ts` (Zod),
  seed idempotent en trois modules (`users`, `spaces`, `events`), refusé si `NODE_ENV=production`.
- Neon : deux URL, `DATABASE_URL` (poolée, client et seed) et `DATABASE_URL_UNPOOLED` (directe, CLI Prisma).
- `docker-compose.yml` : PostgreSQL 17 local, port hôte **5433** (le 5432 est pris par un autre projet de la machine).
- Turborepo : tâche `generate` (client Prisma), dont dépendent `build`, `lint`, `check-types` et `test`.
- Fiches de dépendances (`prisma`, `@prisma/client`, `@prisma/adapter-pg`, `tsx`) validées, installées via `catalog:`.
- `back/` et `front/` non touchés.

**Décisions**

- Prisma épinglé `~7.10.0`, pas 7.10.1 (publiée le 2026-10-15, sous le seuil `minimumReleaseAge`).
- **Aucune génération Zod depuis Prisma, pas de package `db-types`** : `zod-prisma-types` produisait un fichier
  inutilisable avec Prisma 7 (chemin faux, import du client Prisma), un générateur maison aurait été du code à
  maintenir. Les DTO de l'API s'écrivent à la main dans `api-contract` ; les enums viennent de `@planifier/constants`.
  Skills `project-context`, `typescript-strictness` et `workspace-architecture` alignés.
- Pas de helper `upsertById` dans le seed : le typer sans `as` coûte plus que la répétition.
- Tables Better Auth (`Session`, `Account`, `Verification`) : dans le ticket `auth`, pas ici.

**Vérifié** (exécuté le 2026-10-15, relancé avant le commit)

- `pnpm check-types`, `pnpm lint`, `pnpm build` : OK. `pnpm test` : OK **mais rien n'est testé** (aucun package n'a de
  script `test`). `prettier --check` : OK.
- Migration appliquée sur une base vide, absence de dérive schéma/migration, seed lancé deux fois sans doublon.
- **Non testé** : connexion à un vrai Neon (pas d'accès aux environnements partagés) ; aucun test automatisé de la base.

**Ouvert**

- Revue humaine obligatoire avant merge : `turbo.json` (outillage), trois skills modifiés, abandon de `db-types`.
- Les scripts `generate`, `validate` et `format` passent une URL factice (`DATABASE_URL_UNPOOLED=postgresql://unused@…`) :
  documenté, mais c'est un contournement.
- `preferredTheme` et `color` sont des chaînes libres : à fermer (liste dans `constants`) si l'ensemble est stable.
- Le SQL de la migration `init` (267 lignes) est à relire en revue.

**Attendu ensuite**

- Push de la branche puis revue humaine (le push du 2026-10-15 avait échoué : accès SSH à `origin`).
- Ticket « Tests » : fiche Vitest à valider, puis tests du seed et de `getDbEnv` ; ajouter un script `test` à `db`.
- Ticket « CI » : appliquer les migrations sur une base vide, prouver l'absence de dérive, puis seed (procédure déjà
  validée à la main).
- Tickets suivants du kit : `auth` (tables Better Auth, migration des hashs bcrypt), `domain-access` (droits purs),
  `api-contract` puis `api`. Ordre à confirmer.
