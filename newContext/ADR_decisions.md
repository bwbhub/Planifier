# Planifier v2 — ADR (décisions difficiles à inverser)

Format court : contexte, décision, conséquences. Date : 2026-10-15. À répartir en fichiers `docs/adr/NNNN-titre.md` dans le repo.

## 0001 — Évoluer le repo Planifier avec un nouveau squelette
Contexte : un existant avec schéma événements/invitations/rôles utile, mais JS, auth maison, MUI, Express.
Décision : on garde le dépôt, on y crée un nouveau squelette monorepo TS, on migre le schéma puis les écrans module par module. Ce qui peut être gardé reste, le reste est supprimé. `main` n'est pas cassé pendant la migration.
Conséquences : historique conservé, mais réécriture réelle du back et du front.

## 0002 — TypeScript strict, monorepo pnpm + Turborepo
Décision : `apps/web`, `apps/api`, `packages/*`, scope `@planifier/*`, `workspace:*`. `any`/`unknown` bannis.
Cadre d'inspiration : le repo OVC site-gen, **uniquement** pour (a) les grandes lignes techniques, (b) la structure de dossiers, (c) les conventions. Ni le concept, ni le code du concept, ni ses composants UI ne sont repris (NDA). Rien n'est copié, le résultat est « proche », pas identique.
Conséquences : un seul outillage pour tout le dépôt, conventions familières.

## 0003 — API en oRPC + contrats Zod
Décision : séparation `contracts` / implémentation `api`, typage de bout en bout, TanStack Query côté web via l'intégration oRPC. Express abandonné.
Conséquences : back réécrit ; une seule source de vérité pour les types. Moins de documentation publique qu'un REST classique : à garder à l'œil si une API publique devient nécessaire.

## 0004 — Better Auth
Décision : Better Auth, cookies httpOnly, plus de JWT en localStorage, plus de secret par défaut codé en dur. Plugin d'organisations évalué pour l'Espace. Google OAuth ajouté plus tard via la même bibliothèque.
Conséquences : migration des comptes existants (hash bcrypt) à prévoir ; bibliothèque encore jeune, à surveiller.

## 0005 — PostgreSQL sur Neon, Prisma 7, pas de dépendance à l'hébergeur
Décision : Neon (gratuit, branches), Prisma 7. Prisma 8 en release candidate (rc.22 au 14/10/2026) : on n'y passe pas avant sa stabilité. Prisma 7 reste supporté environ 18 mois après la sortie de la 8.
Conséquences : portable par `pg_dump` ; passage payant à l'usage de Neon possible ; aucune fonction propre à un hébergeur.

## 0006 — Hébergement gratuit au départ, deux environnements
Décision : une image Docker par app, configuration par variables d'environnement. Preprod (branche Neon + services gratuits) et prod. Promotion de la même image vers la prod. Preprod : e-mails vers un bac à sable. Clés VAPID et secrets distincts par environnement.
Conséquences : veille des services gratuits (réveil d'environ 1 min), acceptable sans utilisateurs. Migration vers VPS ou plan payant : demi-journée.

## 0007 — Jobs planifiés différés, conçus comme des endpoints
Décision : pas de cron au lancement. Les rappels sont des lignes avec heure et statut ; le traitement est un endpoint HTTP protégé par secret, idempotent. Déclencheur interchangeable (Cloudflare Workers cron gratuit, cron système, pg-boss).
Conséquences : aucun coût au départ ; les rappels, relances et rafraîchissements iCal arrivent avec leurs modules.

## 0008 — UI Tailwind 4 + composants maison
Décision : `packages/ui` propre à Planifier, MUI abandonné, aucun composant d'OVC.
Conséquences : l'UI existante est à refaire ; les maquettes se traduisent directement.

## 0009 — Un seul concept d'Espace
Décision : couple, colocation et vacances sont des Espaces. Membres égaux par défaut, droits fins optionnels. À 2 membres : double propriétaire. Les événements ont toujours des rôles (propriétaire, co-organisateur, invité). Liste, agenda ou événement sans espace = personnel et privé.
Conséquences : un seul système de droits ; extension prévue « mes contacts » (favoris, aide à la création d'événements).

## 0010 — Web Push en VAPID, e-mail derrière une interface
Décision : bibliothèque `web-push`, sans service tiers. E-mail via Resend + React Email, derrière une interface `sendMail`, avec SMTP local pour le dev. PWA sans hors-ligne au départ (installation et push seulement).
Conséquences : portable ; iOS exige l'installation sur l'écran d'accueil (iOS 16.4+) ; domaine à acheter pour la vérification Resend.

## 0011 — Import iCal par upsert sur (source, uid)
Décision : toute entrée importée garde sa source et son UID ; la réimportation est un upsert, jamais une suppression-recréation. Règle anti-boucle : nos exports sont marqués et ignorés à la relecture.
Conséquences : pas de doublons, changements détectables.
