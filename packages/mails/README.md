# @planifier/mails

E-mails de Planifier (ADR 0010) : une interface `SendMail`, deux transports, des gabarits React Email. Serveur
uniquement : importé par `auth`, jamais par le web (lint).

## API publique

- `getSendMail()` : transport du processus, choisi par `MAIL_TRANSPORT` (environnement validé au premier appel).
- `createSendMail(env)`, `parseMailEnv(source)` : pour les tests.
- Gabarits : `verifyEmailMail`, `resetPasswordMail` → `{ subject, html, text }` (le destinataire s'ajoute à l'envoi).

## Transports

| `MAIL_TRANSPORT` | Où partent les e-mails                                    | Variables        |
| ---------------- | --------------------------------------------------------- | ---------------- |
| `mailpit`        | boîte locale (docker-compose), interface `localhost:8025` | `MAILPIT_URL`    |
| `resend`         | Resend, seul admis en production                          | `RESEND_API_KEY` |

`MAIL_FROM` (adresse d'expédition) est toujours exigée. Les deux transports postent en JSON par `fetch` (aucun SDK).
Un refus du fournisseur rejette avec son seul statut HTTP : le corps de réponse, qui peut citer l'adresse, n'est ni
lu ni journalisé.

## Gabarits

Composants `@react-email/*` rendus par `react-dom/server` (`render.ts`) ; version texte écrite par chaque gabarit.
Couleurs : `@planifier/tokens/email` (thème clair, les clients mail ignorent les variables CSS). Les `.tsx`
déclarent leur JSX par pragma : l'API les charge par tsx, qui n'applique pas son tsconfig hors de l'app.

## Interdits

Journaliser une adresse, un lien ou un jeton. Lire `process.env` hors `src/env.ts`.
