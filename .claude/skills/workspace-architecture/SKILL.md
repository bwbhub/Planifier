---
name: workspace-architecture
description: Architecture du monorepo pnpm/Turborepo (apps vs packages, sens des dépendances, packages légers, contrat vs implémentation, création d'un package). À lire avant de créer un package, d'ajouter un import entre apps ou packages, ou de déplacer du code.
---

# Architecture du workspace

## Modèle

- `apps/*` : points d'entrée déployables (`web`, `api`). Une app n'importe **jamais** une autre app.
- `packages/*` : briques réutilisables, découpées par **rôle**.

| Rôle                              | Contenu                                                                | Peut dépendre de                                  |
| --------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------- |
| `constants`, `tokens`, `*-config` | feuilles du graphe                                                     | rien                                              |
| `db-types`                        | schémas Zod générés depuis Prisma                                      | `zod`                                             |
| `api-contract`                    | contrats oRPC et DTO                                                   | `zod`, `@orpc/contract`, `db-types`, `constants`  |
| `domain-*`                        | calcul et règles **pures** (droits, récurrence, soldes, doublons iCal) | `zod`, `constants` au plus                        |
| `db`                              | client Prisma, migrations, seed                                        | `prisma`, `db-types`                              |
| `auth`                            | configuration Better Auth                                              | `db`                                              |
| `mails`                           | gabarits React Email                                                   | `react`, `@react-email/*`                         |
| `api`                             | implémentation serveur, services                                       | `api-contract`, `db`, `auth`, `mails`, `domain-*` |
| `ui`                              | composants **sans métier**                                             | `react`, `tokens`                                 |

## Règles dures

1. Les packages de contrat/types n'importent aucune dépendance lourde (Prisma client, auth, Next, `node:*`, mails).
2. `apps/web` n'importe que contrats, types, `domain-*`, `constants`, `tokens`, `ui`. Jamais `api`, `db`, `auth`, `mails`.
3. Le client Prisma n'est importé que par `db` et `api`. Tout module qui touche la base commence par `import "server-only"`.
4. Dépendances internes en `workspace:*`, import via les `exports` publics du package. Jamais `../../packages/x/src/...`.
5. Pas d'import circulaire. Sens : `api-contract ← api ← app serveur`.
6. Une app ne contient pas de logique métier réutilisable au-delà de l'orchestration : elle va dans un package `domain-*`.
7. Un package = une responsabilité, nommé par son rôle, avec un README (rôle, API publique, interdits).
8. Ces règles sont **vérifiées par outil** (lint, `check-types`) ; ce qui n'est pas outillé reste une recommandation.

## Où mettre ce code ?

1. Existe-t-il déjà quelque chose de similaire ? Le réutiliser ou l'extraire (règle des trois, `code-structure`).
2. Forme de donnée (schéma, type, contrat) → `db-types` (modèle) ou `api-contract` (API).
3. Calcul ou règle pure utilisée par l'API **et** le front → `domain-*`.
4. UI sans donnée ni métier → `ui`. Avec métier → `features/<module>/atoms` de l'app.
5. Spécifique à un écran ou un flux → dans le module, sans sur-généraliser.

## Créer un package : checklist

- [ ] Nom `@planifier/<rôle>`, `private: true`, `sideEffects: false` si possible.
- [ ] `exports` explicites ; pas de barrel géant.
- [ ] `tsconfig` qui étend `@planifier/typescript-config` ; `eslint.config.js` qui étend `@planifier/eslint-config`.
- [ ] Scripts : `lint`, `check-types`, `test` (câblés par Turborepo).
- [ ] Dépendances minimales, chacune avec sa fiche (`dependency-governance`).
- [ ] README ; ligne ajoutée dans `project-context` §2.

## Anti-patterns

Package « utils » fourre-tout ; `ui` qui importe des contrats d'API ; un package de types qui réexporte un client ;
déplacer un composant dans `ui` sans retirer ses appels de données ; deux versions d'une même lib.
