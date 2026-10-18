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

## 2026-10-18 — Package `domain-access` (branche `feat/domain-access`)

**Fait** : `packages/domain-access` (`resource.ts`, `event.ts`, README) : droits purs sur ressource (propriétaire, Espace,
partage direct) et sur événement (OWNER, ORGANIZER, GUEST, reprise de propriété). 23 tests Vitest.
**Décisions** (utilisateur) : membre d'Espace en lecture, écriture sur liste partagée ; suppression par le propriétaire
ou le propriétaire d'Espace ; matrice d'événement OK telle quelle (ORGANIZER n'est pas autorisé à désactiver une brique).
Ajout : le propriétaire d'Espace ne supprime que ce qu'il voit.
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (33 tests), `pnpm build` ; mutations du code : 9 tests échouent.
**Ouvert** : revue humaine (droits). Champ de visibilité de l'Espace absent du schéma : `spaceLevel` est fourni par
l'appelant, le champ viendra avec une migration. Pas de partage par ressource en base (NONE/READ/WRITE) : à modéliser.
**Attendu ensuite** : voir `docs/SUITE.md`.

---

## 2026-10-18 — Tests Vitest sur `db` (branche `feat/tests-vitest`)

**Fait** : `vitest@~5.0.4` (fiche validée par l'utilisateur) au `catalog:` et dans `db` ; script `test` ; tests de
`getDbEnv` (4) et `assertSeedAllowed` (6). Ticket TypeScript strict + ESLint fermé dans ClickUp (déjà livré).
**Décisions** : 5.0.4 et non 5.0.5 (sous `minimumReleaseAge`). `getCliDatabaseUrl` non testée (lit `.env.local` du
dossier courant).
**Vérifié** : `pnpm check-types`, `pnpm lint`, `pnpm test` (10 tests OK), `pnpm build` : OK, exécutés le 2026-10-18.
**Ouvert** : rien commité ni poussé. Tests du seed sur vraie base : avec la CI.
**Attendu ensuite** : voir `docs/SUITE.md`.

---

## 2026-10-17 — Corrections de revue du package `db` (branche `feat/package-db`)

**Fait**

- Alerte GitGuardian « Generic Password » (`docker-compose.yml`, commit `16ed327`) : faux positif, identifiants de dev
  locaux. Aucun secret réel dans l'historique (recherche par motifs ; ni `gitleaks` ni `trufflehog` installés).
- `docker-compose.yml` : PostgreSQL publié sur `127.0.0.1:5433` seulement (plus sur toutes les interfaces).
- Seed : garde `assertSeedAllowed` (`seed/guard.ts`) — refus si l'hôte n'est pas local, en plus de `NODE_ENV=production`.
- `turbo.json` : `dev` dépend de `@planifier/db#generate` (clone neuf).
- Client : singleton sur `globalThis` (rechargement à chaud de `next dev`).
- CLI Prisma : plus d'URL factice ni de chemin `node_modules/prisma/build` ; `prisma.config.ts` lit `.env.local` via
  `getCliDatabaseUrl()` (`src/env.ts`), l'URL est optionnelle pour `generate`/`validate`/`format`.
- Schéma : index `events(start_date)`, `events(space_id, start_date)`, `invites(inviter_id)`, `invites(user_id)`,
  `proposed_invites(proposer_id)`, `notifications(event_id)`, `notifications(user_id, is_read, created_at)`,
  `friendships(friend_id)` (remplace `friendships(user_id)`, couvert par l'unique).
- E-mails en minuscules : contraintes `CHECK` ajoutées à la main dans la migration (`users`, `invites`, `proposed_invites`).
- Seed : l'événement personnel a son participant OWNER et ses réglages, comme un événement créé par le service.
- Migration `init` régénérée (jamais déployée) : toujours une seule migration dans la PR.

**Décisions**

- Pas de `citext` : les extensions sont expérimentales dans la config Prisma 7 ; la contrainte `CHECK` donne la même
  garantie sans extension.
- `Event.ownerId` nullable, `onDelete: SetNull`, avec `ownerLeftAt` (décision de l'utilisateur) : le propriétaire qui
  supprime son compte laisse l'événement aux participants ; un co-organisateur peut reprendre la propriété, sans
  obligation ; sans repreneur sous 48 h, un job planifié supprime l'événement. Contrainte `CHECK` écrite à la main :
  `owner_id` null impose `owner_left_at`, sinon la suppression du compte échoue. Skill `database-prisma` aligné
  (`ownerId` non nul sauf exception documentée).
- Hash des jetons d'invitation (`Invite.token` en clair) : reporté au ticket `auth`, décision de l'utilisateur.
- `Event.space` passe en `onDelete: SetNull` (décision de l'utilisateur) : supprimer un Espace ne détruit rien, ses
  événements deviennent personnels pour leur propriétaire et les participants gardent leur accès. Vérifié sur une base
  temporaire.
- Visibilité par défaut (décision de l'utilisateur, `CONTEXT.md`) : un membre d'Espace voit tous les éléments de
  l'Espace ; elle se restreint dans les paramètres de l'Espace (champ à ajouter avec `domain-access`).
- Scripts d'installation de `prisma`, `@prisma/engines` et `esbuild` autorisés (`onlyBuiltDependencies`).

**Vérifié** (exécuté le 2026-10-17, relancé le 2026-10-18 après `SetNull`)

- `pnpm check-types`, `pnpm lint`, `pnpm test`, `pnpm build`, `prettier --check` : OK. `pnpm test` ne teste toujours rien.
- Base locale neuve : `migrate deploy` OK, `migrate diff --exit-code` sans dérive, seed lancé deux fois sans doublon,
  insertion d'un e-mail en majuscules refusée par la contrainte, seed refusé sur une URL Neon fictive.
- `turbo run dev --dry` : chaque `dev` dépend bien de `@planifier/db#generate`.
- Base temporaire : Espace supprimé ⇒ événements personnels, participants conservés ; compte supprimé sans
  `owner_left_at` ⇒ refusé par la contrainte ; avec ⇒ événements gardés sans propriétaire, autres participants conservés.
- **Non testé** : `pnpm dev` réellement lancé ; Windows ; un vrai Neon.

**Ouvert**

- Alerte GitGuardian à classer en faux positif (action de l'utilisateur) pour que le check passe.
- Revues humaines de l'entrée précédente toujours dues ; s'y ajoutent les contraintes `CHECK` écrites à la main et
  l'exception à la skill `database-prisma`.
- Événement personnel d'un compte supprimé : il resterait sans participant pendant 48 h ; le service de suppression
  de compte devrait le supprimer tout de suite (à trancher dans `auth`).
- Base locale existante : migration `init` modifiée après application, à recréer (`docker compose down -v`).

**Attendu ensuite**

- Classer l'alerte, revue humaine, puis merge.
- Ticket `auth` : hash des jetons d'invitation, service de suppression de compte (renseigne `owner_left_at`),
  normalisation des e-mails (Zod).
- Ticket jobs planifiés (ADR 0007) : suppression des événements sans repreneur 48 h après `owner_left_at`.
- Ticket `domain-access` : droits, dont la reprise de propriété par un co-organisateur et la visibilité de l'Espace.

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
