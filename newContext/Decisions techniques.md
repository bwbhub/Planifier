# Planifier v2 — Décisions techniques et passage de relais (2026-10-15)

Statut : grill technique terminé (Q1 à Q21 tranchées). Documents liés : `contexte-projet.md` (fonctionnel), `CONTEXT.md` (glossaire), `adr-decisions.md` (ADR), `brief-maquettes.md` (UX).

## Récap pour la session terminal (à coller en tête)
On démarre le développement de Planifier v2 dans le repo existant (bwbhub/Planifier). Le repo OVC site-gen est accessible dans cette session, mais il n'est qu'une **référence de proximité** pour : (a) les grandes lignes techniques, (b) la structure de dossiers, (c) les conventions. On ne reprend NI le concept d'OVC, NI le code du concept, NI ses composants UI (NDA, qui porte surtout sur le code du concept). Le README d'OVC donne la doc des technos. Ne rien copier, ne pas reproduire ses parties propres (Payload CMS, MongoDB, multi-tenant).

## Décisions
1. Évoluer le repo Planifier ; nouveau squelette, migration du schéma Prisma puis des écrans par module. Ce qui peut être gardé reste, le reste est supprimé.
2. TypeScript strict. `any`/`unknown` bannis.
3. Monorepo pnpm + Turborepo : `apps/web`, `apps/api`, packages `db`, `contracts`, `ui`, `mails`, `constants`, `eslint-config`, `typescript-config`. Scope `@planifier/*`, `workspace:*`.
4. API : oRPC + contrats Zod (style OVC). Express abandonné.
5. Auth : Better Auth (cookies httpOnly). Migration des comptes existants à prévoir. Google OAuth plus tard.
6. UI : Tailwind 4 + composants maison dans `packages/ui`. MUI abandonné.
7. Base : PostgreSQL sur Neon, Prisma 7 (Prisma 8 encore en RC, on attend sa stabilité). Types Zod générés depuis Prisma dans un package dédié.
8. Hébergement : gratuit au départ (Neon + service gratuit type Render), Docker par app, config par variables d'environnement, portable.
9. Deux environnements dès le début : preprod (branche Neon, déploiement à chaque merge sur `main`) et prod (promotion de la même image). E-mails de preprod vers un bac à sable. Secrets et clés VAPID distincts.
10. Cron : pas au lancement. Rappels = lignes en base ; traitement = endpoints HTTP protégés par secret, idempotents ; déclencheur interchangeable (Cloudflare Workers cron gratuit, etc.).
11. Web Push : `web-push` en VAPID, sans tiers.
12. E-mail : Resend + React Email derrière une interface `sendMail`, SMTP local (Mailpit) en dev.
13. PWA : installation et push, pas de hors-ligne au départ.
14. Tests : Vitest sur la logique pure (droits, doublons iCal, clonage de todo, soldes du budget) + Playwright sur 3 à 4 parcours (inscription, création d'événement, invitation, cocher une tâche).
15. CI : GitHub Actions minimale (lint, typecheck, tests, build des images). Déploiement automatique plus tard.
16. Prisma 7 (voir 7).
17. **Espace** : une seule entité (couple, colocation, vacances). Membres égaux par défaut, droits fins optionnels. À 2 membres : double propriétaire par défaut ; au-delà, le créateur reste propriétaire et peut en nommer d'autres. Les événements ont toujours des rôles, au moins pour le propriétaire.
18. Modules : listes, agendas et événements avec un rattachement optionnel à un Espace ; sans Espace = personnel et privé.
19. Droits : rôle sur l'Espace, plus partage par ressource (aucun, lecture, écriture). Rôles d'événement existants conservés (OWNER, ORGANIZER, GUEST).
20. Invitations par token liées à l'e-mail, conservées telles quelles.
21. Import iCal : upsert sur (source, uid), anti-boucle sur nos exports.
22. **Futur : « mes contacts »** (liste, favoris, aide à la création d'événements). Étend la notion d'amitié existante. Hors premier périmètre mais à ne pas empêcher dans le modèle.

## Faits vérifiés (oct. 2026)
- Vercel Hobby : cron 1 fois par jour, précision ±59 min (insuffisant pour les rappels).
- Render : web gratuit avec veille 15 min (réveil ~1 min) ; Postgres gratuit expire après 30 jours.
- Koyeb : carte demandée. Fly.io et Heroku : plus de gratuit.
- Neon gratuit : 1 Go, 100 h CU/mois, veille après 5 min, 10 branches par projet, sans carte.
- Cloudflare Workers gratuit : 5 cron triggers, 10 ms CPU par déclenchement.
- Prisma 8 en release candidate (rc.22 au 14/10/2026) ; Prisma 7 supporté environ 18 mois après la sortie de la 8.
- Resend gratuit (source secondaire, à confirmer sur leur page de tarifs) : 100 e-mails par jour, 3 000 par mois, 1 domaine vérifié.

## Points à vérifier au démarrage (dans la session terminal)
- Better Auth vs Auth.js : comparaison rapide en ligne avant de verrouiller ; plugin d'organisations utilisable pour l'Espace ?
- Compatibilité Prisma 7 et Neon (connexions poolées).
- Outillage PWA (Serwist ou service worker maison) sur Next 16.
- Page de tarifs Resend, et nom de domaine à acheter.

## Ordre de travail suggéré
1. Squelette monorepo (pnpm, Turborepo, config TS et ESLint partagées) et CI minimale.
2. Packages `db` (schéma migré) et `contracts`.
3. Better Auth et migration des comptes.
4. Module Événements migré sur le nouveau socle (le plus avancé dans l'existant).
5. Notifications (modèle déjà présent) et PWA avec push.
6. Todo, puis Agenda et import iCal.
7. Preprod et prod avant le premier utilisateur réel.
