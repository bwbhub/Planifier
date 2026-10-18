---
name: api-contracts-orpc
description: Créer ou modifier une procédure d'API oRPC (contrat Zod, implémentation, chaîne d'accès, erreurs, pagination, compatibilité, idempotence). À lire pour toute nouvelle procédure, tout changement de contrat ou la relecture d'un routeur. Packages posés : api-contract, api, apps/api (ADR 0015).
---

# API : contrats et implémentation oRPC

## Deux plans d'appel

| Plan            | Qui appelle                                       | Garde                                                       |
| --------------- | ------------------------------------------------- | ----------------------------------------------------------- |
| **Utilisateur** | le navigateur, avec session                       | authentification + droits                                   |
| **Public**      | invité sans compte, via lien d'invitation (token) | liste blanche, limites de débit                             |
| **Jobs**        | déclencheur planifié (ADR 0007)                   | secret partagé, idempotent, jamais appelé par le navigateur |

Chaque procédure appartient à **un** plan. Un test énumère les routeurs et échoue si une procédure n'a aucune garde.

## Procédure (dans cet ordre)

1. **Contrat** dans `api-contract/src/features/<domaine>/<feature>/` : `<feature>.schemas.ts`, puis `<feature>.contract.ts`
   (description lisible par procédure).
2. **Implémentation** dans `api` : handler **mince** qui appelle un service (`<feature>.service.ts`), pur et testable.
3. **Montage** dans le routeur du plan.
4. **Client** : `orpc.<chemin>.queryOptions()` / `mutationOptions()`, **uniquement** dans `queries/` d'un module.
5. **Tests** : service (base réelle), matrice de droits, contrat (`testing-standards`).

## Chaîne d'accès (ordre obligatoire)

limitation de débit → authentification → droits (Espace, rôle, partage) → validation d'entrée (contrat) → handler → validation de sortie.

- Toujours `.input()` **et** `.output()`.
- **Jamais de contrôle d'accès écrit à la main dans un handler** ; restreindre par rôle = ajouter le middleware, pas un `if`.
- L'utilisateur vient du **contexte** (session), jamais de l'entrée.

## Règles de contrat

- Entrées `z.strictObject`, bornées ; `limit ≤ 100` ; pagination par curseur ; tri sur colonnes autorisées.
- Sorties en liste blanche (`typescript-strictness`).
- Mises à jour : `version` en entrée ; `updateMany where id AND version` ; 0 ligne ⇒ `CONFLICT`.
- Effet externe (e-mail, push, invitation) : clé d'idempotence ; **jamais envoyé à l'insu** de l'utilisateur.
- Un invité sans compte ne reçoit jamais de notification.

## Erreurs

Codes stables : `BAD_REQUEST`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `TOO_MANY_REQUESTS`,
`INTERNAL_SERVER_ERROR`. Ressource sans droit ⇒ `NOT_FOUND`. Jamais de stack ni de message d'ORM vers le client ; traduire
`P2002` → `CONFLICT`, `P2025` → `NOT_FOUND`.

## Compatibilité

Front et serveur peuvent tourner à des versions différentes pendant un déploiement : changements **additifs** dans une
release ; retirer ou renommer = `@deprecated`, conserver, supprimer ensuite.

## Observabilité

Journaliser chemin, plan, durée, statut, identifiant de requête ; **jamais** l'entrée brute.
