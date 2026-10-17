---
name: typescript-strictness
description: Typage de bout en bout (Prisma → Zod → contrat → client), interdiction de any, usage de unknown aux frontières, DTO de sortie, parsing, configuration TS/ESLint stricte. À lire en écrivant du TypeScript, des schémas Zod ou des types partagés.
---

# Typage strict de bout en bout

## Flux des types

```
schema.prisma (types Prisma) → api-contract (DTO Zod écrits à la main) → client oRPC (inféré)
```

Un type métier est **dérivé** (`z.infer`, `.pick`, `.omit`, `.extend`), jamais redéclaré à la main. Les DTO Zod
décrivent ce qu'on expose (jamais un modèle brut) ; ils sont vérifiés contre les types Prisma (`satisfies`), pas générés. Un type qui casse un
composant impose de corriger le composant ; pas de cast pour « faire passer ».

## `any` et `unknown`

- `any` interdit (lint en erreur). Interdits aussi : assertions `as X` (sauf `as const`), `!`, `@ts-ignore`.
  `@ts-expect-error` avec une raison d'au moins 10 caractères.
- `unknown` entre aux frontières de confiance (`JSON.parse`, `catch`, réponses externes, colonnes JSON, paramètres d'URL,
  variables d'environnement) ; **un parse Zod** en sort un type précis, tout de suite. Ne pas propager `unknown` dans le métier.
- Toute exception `eslint-disable` : `-- raison + ticket`.

## DTO : ne jamais exposer le modèle DB

- Sorties d'API = liste blanche explicite (`pick`), pas le modèle Prisma entier. Jamais de hash, de token ni de champ interne.
- Création : retirer `id`, `createdAt`, `updatedAt`, `version` et **tout identifiant d'utilisateur** (il vient de la session).
- Mise à jour : champs optionnels explicites + `version`.
- Entrées en `z.strictObject`, avec bornes `min/max` sur chaînes, tableaux et nombres.

## Parser aux frontières

| Frontière                 | Obligation                                                      |
| ------------------------- | --------------------------------------------------------------- |
| Variables d'environnement | `env.ts` par app, parse Zod, échec immédiat                     |
| Colonnes JSON             | schéma Zod versionné, validé en écriture **et** en lecture      |
| Flux iCal, API tierces    | parse Zod ; en cas d'échec, erreur typée + journal, pas de cast |
| Paramètres d'URL          | parse Zod                                                       |

## Bonnes pratiques

- Unions discriminées pour les états + `switch` exhaustif (`switch-exhaustiveness-check`).
- `satisfies` pour valider une constante sans élargir son type.
- Montants : entiers (centimes), jamais flottants. Dates : chaînes ISO sur le fil.
- Identifiants marqués (`.brand<"SpaceId">()`) quand deux ids peuvent être confondus.

## Configuration de référence

`packages/typescript-config` : `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`,
`verbatimModuleSyntax`, `noImplicitOverride`. `packages/eslint-config` : `typescript-eslint` en `strictTypeChecked`,
`--max-warnings 0`. **Jamais** `eslint-plugin-only-warn` : il rend les règles décoratives.
