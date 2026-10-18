# Suite

À écraser en fin de session. Sources de vérité : règles (`AGENTS.md`, skills), tickets ClickUp, code. Le reste : demander.

## 1. À faire par l'utilisateur

- Pousser `feat/api-orpc` (commitée en local) puis ouvrir la PR ; revue humaine (proxy = nouvelle route publique).
- Après merge : fermer `869fhwtcj` dans ClickUp.

## 2. Prochain ticket : `auth` (`869fhwtf2`)

Cadrage fait (commentaire ClickUp du ticket) : `better-auth@~1.7.10`, pas de plugin d'organisations, télémétrie coupée,
tables Session/Account/Verification en une migration, secret obligatoire, cookies httpOnly, limitation de débit,
e-mails en minuscules. Hors PR : hash des jetons d'invitation, service de suppression de compte.

À trancher en début de session :

- `server-only` dans `db` : `apps/api` (Node pur) ne peut pas l'importer tel quel. Options : `--conditions=react-server`
  au lancement de l'API, ou garde équivalente propre à `db`.
- Champs `User` vs schéma Better Auth (`name` obligatoire chez Better Auth, `emailVerified`, `image` ↔ `avatarUrl`).
- Montage : `toNodeHandler` sous `/api/auth` dans `apps/api`, route relayée par le proxy du web (ADR 0015).
- Plan « utilisateur » dans `api` (garde session) + route protégée d'exemple ; limitation de débit du plan public.
- Fiche `better-auth` à écrire dans `docs/DEPENDANCES.md` avant installation.

## 3. Ensuite

1. Migration des comptes bcrypt (`869fhwtf4`).
2. Modèle Espace (`869fhwtf9`) : vérifier ce que couvre déjà `db`.
3. Jobs planifiés (`869fjgrcd`) : plan « jobs » dans `api` (secret partagé).
4. Modèles Todo et Agenda, avec partage par ressource.
5. Docker (`869fhwtcc`) : image `apps/api` (`node --import tsx`), image web.

## 4. Questions ouvertes pour l'utilisateur

- Ticket `869fhwtbz` : texte de mise à jour dans `newContext/tickets-a-creer/03-maj-ticket-organisation-apps-web.md`.
- `newContext/Decisions techniques.md` : supprimer ?
- Granularité de la visibilité d'Espace ; suppression par le propriétaire d'Espace limitée à ce qu'il voit : à confirmer.

## 5. Pièges de l'environnement

- Push SSH impossible depuis ma session ; `git fetch` marche en HTTPS via `gh` (`credential.helper='!gh auth git-credential'`).
- Merge de PR refusé en mode auto : l'utilisateur fusionne.
- Après un changement de branche qui touche `schema.prisma` : `pnpm --filter @planifier/db generate`.
- TypeScript 6 n'inclut plus `@types/*` par défaut : `"types": ["node"]` dans le tsconfig d'un package Node.
- Navigateur : Brave seulement, pas de Chrome ⇒ pas d'extension Claude in Chrome ; vérif visuelle par l'utilisateur.
- Base locale : `docker compose up -d`, port 5433. Dépendance nouvelle : fiche validée avant `pnpm add`.
