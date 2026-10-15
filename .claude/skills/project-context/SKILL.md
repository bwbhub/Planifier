---
name: project-context
description: Contexte du dépôt Planifier (cartographie des apps et packages, commandes, dérogations, dettes connues). À lire en premier avant toute tâche, car il précise et peut adapter les autres skills.
---

# Contexte du projet : Planifier v2

## 1. Identité

Todo, agenda et événements **à la carte**. Vocabulaire complet : `CONTEXT.md`. Décisions : `docs/adr/`.
Principe produit : l'outil aide à planifier, point. Pas de rotation, d'équilibrage, de score ni de jugement ;
rien ne se coche ni ne s'ajoute à l'insu de l'utilisateur.
Langue du dépôt (code, commentaires, commits, docs) : français ; identifiants de code en anglais.

## 2. Cartographie rôle → package

| Rôle                   | Nom réel                                                   | État              |
| ---------------------- | ---------------------------------------------------------- | ----------------- |
| app web                | `apps/web` (`@planifier/web`)                              | squelette posé    |
| app API                | `apps/api`                                                 | à créer           |
| constantes métier      | `@planifier/constants`                                     | posé              |
| design tokens          | `@planifier/tokens`                                        | posé (clair/nuit) |
| composants sans métier | `@planifier/ui`                                            | `cn` seulement    |
| lint / tsconfig        | `@planifier/eslint-config`, `@planifier/typescript-config` | posés             |
| base + client          | `@planifier/db` (Prisma 7)                                 | posé              |
| contrats d'API         | `@planifier/api-contract`                                  | à créer           |
| implémentation API     | `@planifier/api`                                           | à créer           |
| auth                   | `@planifier/auth`                                          | à créer           |
| droits (logique pure)  | `@planifier/domain-access`                                 | à créer           |
| e-mails                | `@planifier/mails`                                         | à créer           |

## 3. Bibliothèques canoniques (une seule par besoin)

pnpm + Turborepo · Next.js 16 · React 19 · TypeScript 6 · Tailwind 4 · Zod 4 · oRPC · TanStack Query · Better Auth ·
PostgreSQL + Prisma 7 · React Email + Resend · web-push · Vitest · Playwright. Fiches : `docs/DEPENDANCES.md`.

## 4. Commandes

| Action                       | Commande                                                      |
| ---------------------------- | ------------------------------------------------------------- |
| Installer                    | `pnpm install`                                                |
| Développer                   | `pnpm dev` (ou `pnpm --filter @planifier/web dev`)            |
| Types · lint · tests · build | `pnpm check-types` · `pnpm lint` · `pnpm test` · `pnpm build` |
| Formater                     | `pnpm format`                                                 |
| Ancien code                  | `pnpm legacy:back` · `pnpm legacy:front`                      |

## 5. Environnement

`.env.example` à la racine ; `env.ts` par app avec schéma Zod ; aucun `NEXT_PUBLIC_*`. Voir `runtime-configuration`.

## 6. Dérogations

| ID  | Règle écartée                                                | Raison                                  | Réexamen                                 |
| --- | ------------------------------------------------------------ | --------------------------------------- | ---------------------------------------- |
| D1  | TypeScript 7                                                 | `typescript-eslint` exige `<6.1`        | prochaine version de `typescript-eslint` |
| D2  | ESLint 10                                                    | `eslint-plugin-react` exige ESLint ≤ 9  | sortie d'une version compatible          |
| D3  | `back/` et `front/` hors workspace, non conformes aux règles | ancien code en lecture seule (ADR 0001) | retrait module par module                |

## 7. Dettes connues

1. Ancien code (`back/`, `front/`) : JS, MUI, Express, JWT en localStorage, secret JWT par défaut codé en dur.
2. Racine : `package-lock.json` (npm) conservé pour l'ancien code ; à retirer avec lui.
3. Aucun test, aucune CI pour l'instant (tickets « Tests » et « CI »).
4. `packages/ui` ne contient pas encore de composants (ticket design system).
