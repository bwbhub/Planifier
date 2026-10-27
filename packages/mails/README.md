# @planifier/mails

E-mails de Planifier (ADR 0010) : une interface `SendMail`, deux transports, des gabarits React Email. Serveur
uniquement : importé par `auth`, jamais par le web (lint).

## API publique

- `getSendMail()` : transport du processus, choisi par `MAIL_TRANSPORT` (environnement validé au premier appel).
- Gabarits : `verifyEmailMail`, `resetPasswordMail`, `existingAccountMail` → `{ subject, html, text }` (le
  destinataire s'ajoute à l'envoi). Tous passent par `actionMail` (un titre, des paragraphes, un bouton) ; un nom
  choisi à l'inscription n'apparaît que dans un e-mail envoyé à un compte vérifié (risque d'hameçonnage sinon).

## Transports

| `MAIL_TRANSPORT` | Où partent les e-mails                                    | Variables        |
| ---------------- | --------------------------------------------------------- | ---------------- |
| `mailpit`        | boîte locale (docker-compose), interface `localhost:8025` | `MAILPIT_URL`    |
| `resend`         | Resend, seul admis en production                          | `RESEND_API_KEY` |

`MAIL_FROM` (adresse d'expédition) est toujours exigée. `MAIL_ALLOWED_DOMAINS` (bac à sable de preprod) limite les
destinataires à une liste de domaines ; les autres e-mails sont écartés sans erreur, journalisés sans adresse. Les deux transports postent en JSON par `fetch` (aucun SDK).
Un refus du fournisseur rejette avec son seul statut HTTP : le corps de réponse, qui peut citer l'adresse, n'est ni
lu ni journalisé.

## Gabarits

Composants `@react-email/*` rendus par `react-dom/server` (`templates/action-mail.tsx`), version texte tirée du
même contenu. Couleurs et rayons : `@planifier/tokens/email` (les clients mail ignorent les variables CSS). Le seul
`.tsx` déclare son JSX par pragma : l'API le charge par tsx, qui n'applique pas son tsconfig hors de l'app.
Invitation à un événement (seul gabarit de l'ancien `emailService`) : avec le module Événements.

## Interdits

Journaliser une adresse, un lien ou un jeton. Lire `process.env` hors `src/env.ts`.
