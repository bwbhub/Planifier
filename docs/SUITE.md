# Suite

À écraser en fin de session. Sources de vérité : règles (`AGENTS.md`, skills), tickets ClickUp, code. Le reste : demander.

## 1. À faire par l'utilisateur

- **Vérif Brave à faire** (rien n'a été vu dans un navigateur) : formulaires de connexion et d'inscription (erreurs
  de champ, focus, message de refus), accueil, déconnexion ; clair et nuit ; mobile et PC. Page d'erreur : lancer le
  web seul (`pnpm --filter @planifier/web dev`, API arrêtée), ouvrir `/connexion`, voir « Réessayer ».
- **Deux nouveaux fichiers de maquettes** à déposer dans `docs/maquettes/` (absents du dépôt au 2026-10-20). Les lire
  avant la suite : écarts avec les écrans de connexion/inscription déjà faits, puis profil (partie 2).
- Compte de démo pour la vérif : `pnpm seed` si la base est neuve, puis `alice@example.test` / `planifier-demo`.
- Puis demander push + PR de `feat/ecrans-connexion` (inclut le commit docs de `docs/suite-apres-auth`, branche
  devenue inutile). Revue humaine : auth, `turbo.json`, dépendances de test, dérogation D5 (axe-core MPL-2.0).

## 2. Prochain ticket : profil (`869fhwtf7`, partie 2)

D'abord : lire les deux nouvelles maquettes, mettre à jour `ux-design-brief` (source des écrans) et corriger les
écrans de connexion/inscription s'ils s'en écartent (même branche si la PR n'est pas ouverte).

Nom affiché, mot de passe (Better Auth `change-password`), thème préféré (`preferredTheme`, liste fermée à créer
dans `constants`). Changement d'e-mail : après `mails` (vérification). Navigation vers le profil à concevoir
(navigation mobile non maquettée).

## 3. Ensuite

1. E2E Playwright (`869fkd81n`) : fiche, smoke inscription/connexion, CI.
2. Package `mails` : vérification d'e-mail, réinitialisation de mot de passe (réponse générique à l'inscription).
3. Modèle Espace (`869fhwtf9`) : vérifier ce que couvre déjà `db`.
4. Jobs planifiés (`869fjgrcd`) : plan « jobs » dans `api` (secret partagé).
5. Docker (`869fhwtcc`) : image `apps/api` (`node --import tsx`), image web.
6. Hors PR : hash des jetons d'invitation, service de suppression de compte (`owner_left_at`).

## 4. Questions ouvertes pour l'utilisateur

- Ticket `869fhwtbz` : texte de mise à jour dans `newContext/tickets-a-creer/03-maj-ticket-organisation-apps-web.md`.
- `newContext/Decisions techniques.md` : supprimer ?
- Granularité de la visibilité d'Espace ; suppression par le propriétaire d'Espace limitée à ce qu'il voit : à confirmer.
- Hébergeur : son relais ajoute-t-il `x-forwarded-for` (fiabilité de l'IP, ADR 0016) ?
- Après connexion, revenir à la page demandée (`?suite=`, chemin interne seulement) : utile ?
- Ancien formulaire : remettre « afficher le mot de passe » et la confirmation à l'inscription ? Invitation par
  lien (e-mail pré-rempli) : avec le module Événements.
- Token d'erreur distinct de l'accent (aujourd'hui erreurs et liens partagent `accent-text`) : ticket design system ?

## 5. Pièges de l'environnement

- Push SSH impossible depuis ma session ; `git fetch` marche en HTTPS via `gh` (`credential.helper='!gh auth git-credential'`).
- Merge de PR refusé en mode auto : l'utilisateur fusionne.
- Après un changement de branche qui touche `schema.prisma` : `pnpm --filter @planifier/db generate`.
- TypeScript 6 n'inclut plus `@types/*` par défaut : `"types": ["node"]` dans le tsconfig d'un package Node.
- Navigateur : Brave seulement, pas de Chrome ⇒ pas d'extension Claude in Chrome ; vérif visuelle par l'utilisateur.
- Base locale : `docker compose up -d`, port 5433. Dépendance nouvelle : fiche validée avant `pnpm add`.
- `pnpm --filter X add` peut délier les `node_modules` d'autres packages : relancer `pnpm install` ensuite.
- Better Auth coupe son contrôle d'origine en environnement de test : `disableOriginCheck: false` le garde actif.
- Tests sur base : `DATABASE_URL=postgresql://planifier:planifier@localhost:5433/planifier_test pnpm test:integration`
  (suites sérialisées : `auth` puis `api-server`, même base).
- Node local 24.11 : jsdom 30 refusé (D4). Tests de composants web : `// @vitest-environment jsdom` en tête de fichier.
- Le tsconfig de Next garde le JSX (`preserve`) : `oxc.jsx` dans `apps/web/vitest.config.ts`.
