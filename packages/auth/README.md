# @planifier/auth

Configuration Better Auth (ADR 0004, 0016) : e-mail + mot de passe, session par cookie httpOnly, limitation de débit.
Serveur uniquement : importé par `api` (type `SessionUser`) et `apps/api`, jamais par le web (lint).

## API publique

- `getAuth()` : instance unique du processus (environnement et base validés au premier appel).
- `createAuth(db, env, sendMail)`, `parseAuthEnv(source)` : pour les tests d'intégration (`sendMail` factice qui
  garde les e-mails).
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

Choix explicites : télémétrie coupée ; journal au niveau `warn` (au niveau `info`, Better Auth écrit des adresses) ; contrôle d'origine forcé (Better Auth le coupe en test) ; limitation de débit
toujours active, en mémoire ; seul en-tête d'IP cru : `x-planifier-client-ip` (posé par le proxy du web) ;
identifiants générés par Prisma ; e-mails ramenés en minuscules par Better Auth (et contrainte `CHECK` en base) ;
nom affiché validé à chaque écriture (`parseDisplayName`, crochets `databaseHooks`). Bornes du nom et du mot de
passe : `@planifier/constants/account`, partagées avec les formulaires du web.

## E-mails (package `mails`)

- Adresse vérifiée **avant** toute session (`requireEmailVerification`) : l'inscription répond pareil, que l'adresse
  ait un compte ou non. Le lien (valable `EMAIL_LINK_TTL_SECONDS`) ouvre la session ; une connexion tentée avant en
  renvoie un neuf.
- Inscription sur une adresse déjà inscrite (`onExistingUserSignUp`) : e-mail à son propriétaire, lien de connexion
  (adresse vérifiée) ou nouveau lien de vérification (sinon). Écart de durée de réponse résiduel : un compte neuf
  est écrit en base, pas un doublon.
- Mot de passe oublié : lien vers `AUTH_PAGES.resetPassword` (`constants/account`) ; le nouveau mot de passe ferme les sessions.
- Envoi en arrière-plan (`auth-mails.ts`) : la durée de réponse ne trahit pas l'existence d'un compte, un échec
  d'envoi est journalisé sans adresse ni lien.

## Pas encore

Changement d'e-mail, Google OAuth, hash des jetons d'invitation, suppression de compte. Aucune reprise des comptes de l'ancienne app (ADR 0004).

## Interdits

Importer ce package depuis `apps/web`. Journaliser un jeton, un cookie ou un mot de passe. Lire `process.env` hors
`src/env.ts`.
