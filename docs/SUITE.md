# Suite

À écraser en fin de session. Sources de vérité : règles (`AGENTS.md`, skills), tickets ClickUp, code. Le reste : demander.

## 1. À faire par l'utilisateur (avant de coder)

Ordre de merge conseillé, une revue chacune. Les branches `feat/db-visibilite-espace` et `chore/ci-github-actions` sont
commitées en local, **pas encore poussées**.

| Branche                      | Contenu                              | Revue humaine               |
| ---------------------------- | ------------------------------------ | --------------------------- |
| `feat/domain-access` (PR #3) | droits purs + RECAP/SUITE            | oui (droits)                |
| `chore/ci-github-actions`    | workflow CI                          | oui (CI) ; vérifier 1er run |
| `feat/db-visibilite-espace`  | colonne `spaces.restrict_visibility` | oui (migration)             |
| `chore/nettoyage-depot`      | suppressions, maquette déplacée      | rapide                      |
| `chore/commentaires`         | commentaires seed, env, next.config  | rapide                      |

Après merge : fermer dans ClickUp `869fhwtfj` (droits) et `869fhwtcb` (CI ; les images Docker restent dans `869fhwtcc`).
`869fhwtuq` (Vitest) reste ouvert : il manque doublons iCal, clonage de todo, soldes, récurrence.

## 2. Prochain ticket : `auth` (`869fhwtf2`) — session neuve, modèle Opus 5.5

Revue humaine obligatoire. À cadrer avec l'utilisateur avant d'écrire (skills `auth-authorization`, `database-prisma`,
`dependency-governance`) :

- Fiche de dépendance `better-auth` (1.7.x) à valider avant installation ; vérifier le plugin d'organisations pour l'Espace.
- Tables Better Auth (`Session`, `Account`, `Verification`) : une migration pour la PR.
- Hash des jetons d'invitation (`Invite.token` est en clair aujourd'hui).
- Service de suppression de compte : renseigne `events.owner_left_at` dans la même transaction ; supprime tout de suite
  les événements personnels sans autre participant (sinon ils restent 48 h sans propriétaire) : à trancher.
- E-mails normalisés en minuscules (Zod) avant écriture (contrainte `CHECK` en base).
- Migration des comptes bcrypt : ticket séparé `869fhwtf4`.
- Cookies httpOnly, pas de secret par défaut, limitation de débit (connexion, inscription, invitation).

## 3. Ensuite

1. `api-contract` puis `api` (`869fhwtcj`) : oRPC, chaîne d'accès (`domain-access`), `NOT_FOUND` sans droit.
2. Modèle Espace (`869fhwtf9`) : vérifier ce qui est déjà couvert par `db` (modèle posé, service absent).
3. Jobs planifiés (`869fjgrcd`) : suppression des événements sans repreneur 48 h après `owner_left_at`.
4. Modèles Todo et Agenda : y ajouter le partage par ressource (NONE/READ/WRITE) lu par `domain-access`.

## 4. Questions ouvertes pour l'utilisateur

- Mise à jour de la description du ticket `869fhwtbz` (« Organisation modulaire de apps/web ») dans ClickUp : texte dans
  `newContext/tickets-a-creer/03-maj-ticket-organisation-apps-web.md`, à appliquer puis supprimer le fichier.
- `newContext/Decisions techniques.md` : supprimer ? (21 décisions, à comparer aux ADR).
- Granularité de la visibilité d'Espace (tout l'Espace aujourd'hui ; par module ou par membre plus tard ?).
- Le propriétaire d'Espace supprime ce qu'il voit seulement (ajout de ma part dans `domain-access`) : à confirmer.

## 5. Pièges de l'environnement

- Push depuis ma session impossible (agent SSH vide, passphrase) : l'utilisateur pousse depuis son terminal.
- Le merge de PR est refusé en mode auto : l'utilisateur fusionne.
- Après un changement de branche qui touche `schema.prisma` : `pnpm --filter @planifier/db generate`.
- Base locale : `docker compose up -d`, port 5433. Bases temporaires pour tester les migrations, jamais la base de dev.
- Dépendance nouvelle : fiche validée dans `docs/DEPENDANCES.md` avant `pnpm add`.
