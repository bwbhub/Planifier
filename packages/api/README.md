# @planifier/api

Implémentation des contrats de `api-contract` : routeur, chaîne d'accès, handlers et services. Monté par `apps/api`.

## API publique

- `router` : routeur complet, vérifié contre le contrat (`implement(contract)`).
- `ApiRouter`, `ApiContext` (contexte de requête fourni par le serveur HTTP : identifiant, IP du client, lecture de
  la session, client de la base `getDb`).

## Plans d'appel

Toute procédure part d'un builder de plan (`src/procedures.ts`), qui commence par la garde du plan :

| Builder           | Garde         | État                                                       |
| ----------------- | ------------- | ---------------------------------------------------------- |
| `publicProcedure` | `publicGuard` | sans session ; limitation de débit par IP                  |
| `userProcedure`   | `userGuard`   | limitation de débit, puis session (`UNAUTHORIZED` sinon)   |
| jobs              | —             | à créer avec les jobs planifiés (ADR 0007, secret partagé) |

Limitation : 120 requêtes / min / IP, en mémoire (`src/rate-limit.ts`) ; une seule instance d'API pour l'instant.
Le plan utilisateur ajoute `user` (`SessionUser` de `@planifier/auth`) au contexte.

Garde de ressource, après la validation d'entrée : `spaceGuard(action)` (`src/features/spaces/space-guard.ts`) lit le
rôle de l'appelant dans l'Espace visé (`spaceId`) et applique `canAccessSpace` de `domain-access` ; non membre ⇒
`NOT_FOUND`, membre sans le droit ⇒ `FORBIDDEN`. Les règles d'état (dernier propriétaire, Espace plein) vivent dans les
services, en transaction sous le verrou de la ligne de l'Espace (`space-lock.ts`).

## Domaines

| Chemin           | Contenu                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `account.me`     | utilisateur de la session                                                                                              |
| `spaces.space`   | créer, lister, lire, modifier, supprimer, quitter un Espace                                                            |
| `spaces.members` | changer le rôle d'un membre, retirer un membre                                                                         |
| `spaces.invites` | liens d'invitation (usage unique, 7 jours, empreinte SHA-256 seule en base) : créer, lister, révoquer, voir, rejoindre |

`src/router.test.ts` parcourt le routeur et échoue si une procédure ne commence pas par une garde de `PLAN_GUARDS`.

## Tests

`pnpm test` : unitaires, sans base (`getDb` y échoue). `pnpm test:integration` : services et droits sur base réelle
(`*.integration.test.ts`, base `_test`, voir README de `db`).

## Interdits

Pas de contrôle d'accès écrit à la main dans un handler (règle 6) ; l'utilisateur vient du contexte, jamais de l'entrée.
Jamais importé par `apps/web`.
