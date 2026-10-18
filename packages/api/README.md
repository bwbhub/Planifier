# @planifier/api

Implémentation des contrats de `api-contract` : routeur, chaîne d'accès, handlers et services. Monté par `apps/api`.

## API publique

- `router` : routeur complet, vérifié contre le contrat (`implement(contract)`).
- `ApiRouter`, `ApiContext` (contexte de requête fourni par le serveur HTTP).

## Plans d'appel

Toute procédure part d'un builder de plan (`src/procedures.ts`), qui commence par la garde du plan :

| Builder           | Garde         | État                                                       |
| ----------------- | ------------- | ---------------------------------------------------------- |
| `publicProcedure` | `publicGuard` | sans session ; limitation de débit à venir (ticket auth)   |
| utilisateur       | —             | à créer avec l'authentification (session, puis droits)     |
| jobs              | —             | à créer avec les jobs planifiés (ADR 0007, secret partagé) |

`src/router.test.ts` parcourt le routeur et échoue si une procédure ne commence pas par une garde de `PLAN_GUARDS`.

## Interdits

Pas de contrôle d'accès écrit à la main dans un handler (règle 6) ; l'utilisateur vient du contexte, jamais de l'entrée.
Jamais importé par `apps/web`.
