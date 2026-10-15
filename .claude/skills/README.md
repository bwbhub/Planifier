# Kit de règles Planifier

Un skill = un sujet, chargé à la demande. Lire d'abord `project-context`, puis ceux du sujet. `agent-guardrails` s'applique toujours.

| Skill                       | Quand le lire                                                        |
| --------------------------- | -------------------------------------------------------------------- |
| `project-context`           | toujours en premier : cartographie, commandes, dérogations           |
| `agent-guardrails`          | toujours : ce qu'un agent peut faire seul, ce qui demande validation |
| `feature-delivery-workflow` | démarrer ou livrer une fonctionnalité                                |
| `workspace-architecture`    | créer un package, ajouter un import entre apps/packages              |
| `feature-first-structure`   | placer un fichier dans `apps/web`                                    |
| `code-structure`            | écrire ou refactorer (DRY, KISS, limites de taille)                  |
| `typescript-strictness`     | typage, Zod, `any`/`unknown`, DTO                                    |
| `dependency-governance`     | avant tout `pnpm add`                                                |
| `runtime-configuration`     | variables d'environnement, `env.ts`                                  |
| `database-prisma`           | schéma, migrations, requêtes                                         |
| `api-contracts-orpc`        | créer ou modifier une procédure d'API                                |
| `auth-authorization`        | session, Espaces, droits, invitations                                |
| `frontend-data-state`       | TanStack Query, stores, formulaires                                  |
| `ui-design-system`          | `packages/ui`, tokens, accessibilité                                 |
| `ux-design-brief`           | direction « Doux et vivant », ton, principes produit                 |
| `testing-standards`         | quoi tester, comment                                                 |

Statut : les skills `database-prisma`, `api-contracts-orpc`, `auth-authorization` et `frontend-data-state` décrivent
les conventions **visées** ; les packages correspondants n'existent pas encore (voir les tickets ClickUp).
