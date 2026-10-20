# @planifier/api

Implémentation des contrats de `api-contract` : routeur, chaîne d'accès, handlers et services. Monté par `apps/api`.

## API publique

- `router` : routeur complet, vérifié contre le contrat (`implement(contract)`).
- `ApiRouter`, `ApiContext` (contexte de requête fourni par le serveur HTTP : identifiant, IP du client, lecture de
  la session).

## Plans d'appel

Toute procédure part d'un builder de plan (`src/procedures.ts`), qui commence par la garde du plan :

| Builder           | Garde         | État                                                       |
| ----------------- | ------------- | ---------------------------------------------------------- |
| `publicProcedure` | `publicGuard` | sans session ; limitation de débit par IP                  |
| `userProcedure`   | `userGuard`   | limitation de débit, puis session (`UNAUTHORIZED` sinon)   |
| jobs              | —             | à créer avec les jobs planifiés (ADR 0007, secret partagé) |

Limitation : 120 requêtes / min / IP, en mémoire (`src/rate-limit.ts`) ; une seule instance d'API pour l'instant.
Le plan utilisateur ajoute `user` (`SessionUser` de `@planifier/auth`) au contexte.

`src/router.test.ts` parcourt le routeur et échoue si une procédure ne commence pas par une garde de `PLAN_GUARDS`.

## Interdits

Pas de contrôle d'accès écrit à la main dans un handler (règle 6) ; l'utilisateur vient du contexte, jamais de l'entrée.
Jamais importé par `apps/web`.
