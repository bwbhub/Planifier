# @planifier/auth

Configuration Better Auth (ADR 0004, 0016) : e-mail + mot de passe, session par cookie httpOnly, limitation de débit.
Serveur uniquement : importé par `api` (type `SessionUser`) et `apps/api`, jamais par le web (lint).

## API publique

- `getAuth()` : instance unique du processus (environnement et base validés au premier appel).
- `createAuth(db, env)`, `parseAuthEnv(source)` : pour les tests d'intégration.
- `getSessionUser(auth, headers)` : utilisateur de la session du cookie, ou `null`.
- `createAuthNodeHandler(auth)` : gestionnaire HTTP des routes `/api/auth/*`, monté par `apps/api`.

## Comptes de démo

`pnpm seed` (racine) lance le seed de `db` puis celui-ci : mot de passe `planifier-demo` sur `alice@example.test`,
`bob@example.test`, `chloe@example.test` (hash Better Auth). Base locale uniquement ; lit `../db/.env.local`
(une seule URL de base pour les deux seeds). Test : `pnpm test:integration`.

## Configuration

| Variable             | Rôle                                                                  |
| -------------------- | --------------------------------------------------------------------- |
| `BETTER_AUTH_SECRET` | signature et chiffrement ; ≥ 32 caractères, non trivial en production |
| `BETTER_AUTH_URL`    | origine publique du web, seule origine de confiance ; https en prod   |
| `NODE_ENV`           | cookies `Secure` en production                                        |

Choix explicites : télémétrie coupée ; contrôle d'origine forcé (Better Auth le coupe en test) ; limitation de débit
toujours active, en mémoire ; seul en-tête d'IP cru : `x-planifier-client-ip` (posé par le proxy du web) ;
identifiants générés par Prisma ; e-mails ramenés en minuscules par Better Auth (et contrainte `CHECK` en base) ;
nom affiché validé à chaque écriture (`parseDisplayName`, crochets `databaseHooks`). Bornes du nom et du mot de
passe : `@planifier/constants/account`, partagées avec les formulaires du web.

## Pas encore

Vérification d'e-mail, réinitialisation de mot de passe (package `mails`), Google OAuth, hash des jetons
d'invitation, suppression de compte. Aucune reprise des comptes de l'ancienne app (ADR 0004).

## Interdits

Importer ce package depuis `apps/web`. Journaliser un jeton, un cookie ou un mot de passe. Lire `process.env` hors
`src/env.ts`.
