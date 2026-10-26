# Suite

À écraser en fin de session. Sources de vérité : règles (`AGENTS.md`, skills), tickets ClickUp, code. Le reste : demander.

## 1. À faire par l'utilisateur

- **Push** de `feat/ecrans-connexion` (1 commit local en avance) puis de `feat/profil` (empilée dessus) : SSH
  refusé depuis ma session, et un second essai a été bloqué par le mode auto. Ensuite me demander les PR.
- **Vérif Brave** (toujours rien vu dans un navigateur ; Brave headless bloqué par le bac à sable) : connexion,
  inscription, accueil, déconnexion, **profil** (`/profil` : nom, thème, mot de passe ; le thème doit basculer dès
  « Enregistrer ») ; clair et nuit ; mobile et PC. Page d'erreur : web seul (API arrêtée), `/connexion`, « Réessayer ».
- Compte de démo : `pnpm seed`, puis `alice@example.test` / `planifier-demo`.
- Revue humaine : auth (champ `preferredTheme` de Better Auth, `/update-user`, `/change-password`), migration
  `theme_prefere` (colonne recréée), `ChoiceGroup` dans `packages/ui`.

## 2. Prochain ticket

Profil livré sur `feat/profil` (`869fhwtf7`, partie 2) sauf : changement d'e-mail (attend `mails`), suppression
de compte (service `owner_left_at`), accès mobile au profil (lien provisoire sur l'accueil ; candidat : initiale
ronde en haut d'Aujourd'hui, à valider).

## 3. Ensuite

1. E2E Playwright (`869fkd81n`) : fiche, smoke inscription/connexion/profil, CI.
2. Package `mails` : vérification d'e-mail, réinitialisation, changement d'e-mail.
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
- Token d'erreur : la maquette v2 n'en a pas (erreurs en `ink`/`accent-text` + icône). Question close sauf avis contraire.
- Module Journal (nouveau dans la maquette) : ticket à créer ? Glossaire posé dans `CONTEXT.md`, à valider. Verrou à
  6 chiffres + « Utiliser mon mot de passe » : revue sécurité à prévoir.

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
- `/update-user` de Better Auth accepte aussi `image` (→ `avatarUrl`) sans contrôle : à fermer avec les avatars.
- jsdom n'a pas `CSS.escape` : `userEvent.keyboard` sur des radios plante ; tester au clic.
- Le tsconfig de Next garde le JSX (`preserve`) : `oxc.jsx` dans `apps/web/vitest.config.ts`.
