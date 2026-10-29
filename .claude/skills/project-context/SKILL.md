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

| Rôle                   | Nom réel                                                   | État                                                                                       |
| ---------------------- | ---------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| app web                | `apps/web` (`@planifier/web`)                              | squelette posé                                                                             |
| app API                | `apps/api` (`@planifier/api-server`)                       | posé (santé)                                                                               |
| constantes métier      | `@planifier/constants`                                     | posé                                                                                       |
| design tokens          | `@planifier/tokens`                                        | posé (clair/nuit)                                                                          |
| composants sans métier | `@planifier/ui`                                            | `Button`, `TextField`, `TextAreaField`, `ChoiceGroup`, `Checkbox`, `ConfirmPanel`, `Sheet` |
| lint / tsconfig        | `@planifier/eslint-config`, `@planifier/typescript-config` | posés                                                                                      |
| base + client          | `@planifier/db` (Prisma 7)                                 | posé                                                                                       |
| contrats d'API         | `@planifier/api-contract`                                  | posé (santé)                                                                               |
| implémentation API     | `@planifier/api`                                           | plans public, user ; Espaces, Todo                                                         |
| auth                   | `@planifier/auth`                                          | posé (Better Auth)                                                                         |
| droits (logique pure)  | `@planifier/domain-access`                                 | posé                                                                                       |
| récurrence (pure)      | `@planifier/domain-recurrence`                             | posé                                                                                       |
| e-mails                | `@planifier/mails`                                         | posé (Resend / Mailpit, gabarits React Email)                                              |

## 3. Bibliothèques canoniques (une seule par besoin)

pnpm + Turborepo · Next.js 16 · React 19 · TypeScript 6 · Tailwind 4 · Zod 4 · oRPC · TanStack Query · Better Auth ·
PostgreSQL + Prisma 7 · React Email + Resend · web-push · Vitest · Playwright. Fiches : `docs/DEPENDANCES.md`.

## 4. Commandes

| Action                       | Commande                                                                                                                                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Installer                    | `pnpm install`                                                                                                                                                                  |
| Développer                   | `docker compose up -d` (Postgres 5433, Mailpit 8025) puis `pnpm dev`                                                                                                            |
| Types · lint · tests · build | `pnpm check-types` · `pnpm lint` · `pnpm test` · `pnpm build`                                                                                                                   |
| Tests sur base réelle        | `DATABASE_URL=…/planifier_test pnpm test:integration` (base `_test` migrée, voir README de `db`)                                                                                |
| Tests E2E (Playwright)       | `DATABASE_URL=…/planifier_test MAILPIT_URL=http://localhost:8025 pnpm test:e2e` (construit le web ; 1re fois : `pnpm --filter @planifier/web exec playwright install chromium`) |
| Formater                     | `pnpm format`                                                                                                                                                                   |
| Données de démo              | `pnpm seed` (base locale ; comptes `alice@example.test`… mot de passe `planifier-demo`)                                                                                         |
| Ancien code                  | `pnpm legacy:back` · `pnpm legacy:front`                                                                                                                                        |

## 5. Environnement

`.env.example` à la racine ; `env.ts` par app avec schéma Zod ; aucun `NEXT_PUBLIC_*`. Voir `runtime-configuration`.

GitGuardian (check des PR) : les tests, le `docker-compose.yml`, la CI et les mots de passe de démo sont exclus dans
le tableau de bord (Settings → Secrets detection → Filepath exclusions), pas dans le dépôt : l'app GitHub ne lit pas
de fichier de configuration. Les messages d'interface pris pour des mots de passe (« Saisis ton mot de passe actuel. »)
sont exclus par motif (Secret pattern exclusions : `^(Saisis|Choisis) `). Un autre faux positif se classe dans le
tableau de bord, sans réécrire le code pour tromper le détecteur.

Aucun environnement déployé (ni prod ni preprod, état au 2026-10-20) : aucune donnée ni version à préserver. Les
règles de compatibilité de déploiement (expand/contract, contrats en deux temps) s'appliquent à partir de la
première mise en ligne. D'ici là, priorité à la simplicité et à la lisibilité : modifier directement plutôt que
contourner.

## 6. Dérogations

| ID  | Règle écartée                                                | Raison                                                         | Réexamen                                     |
| --- | ------------------------------------------------------------ | -------------------------------------------------------------- | -------------------------------------------- |
| D1  | TypeScript 7                                                 | `typescript-eslint` exige `<6.1`                               | prochaine version de `typescript-eslint`     |
| D2  | ESLint 10                                                    | `eslint-plugin-react` exige ESLint ≤ 9                         | sortie d'une version compatible              |
| D3  | `back/` et `front/` hors workspace, non conformes aux règles | ancien code en lecture seule (ADR 0001)                        | retrait module par module                    |
| D4  | jsdom 30                                                     | exige Node ≥ 24.15 (machine en 24.11) : jsdom 29               | Node ≥ 24.15 sur la machine et la CI         |
| D5  | licences autorisées (`dependency-governance`)                | axe-core en MPL-2.0 : outil de test, non modifié, jamais livré | outil d'accessibilité sous licence autorisée |

## 7. Dettes connues

1. Ancien code (`back/`, `front/`) : JS, MUI, Express, JWT en localStorage, secret JWT par défaut codé en dur.
2. Racine : `package-lock.json` (npm) conservé pour l'ancien code ; à retirer avec lui.
3. `packages/ui` : `Button`, `TextField`, `TextAreaField`, `ChoiceGroup`, `Checkbox`, `ConfirmPanel`, `Sheet` seulement (le reste avec le ticket design system).
4. Limitation de débit en mémoire (Better Auth et plans oRPC) : une seule instance d'API tant qu'elle n'est pas
   partagée (ADR 0016). Réexamen : ticket Docker / déploiement (`869fhwtcc`), avant toute seconde instance.
5. Pas de changement d'e-mail (ticket `869fmk5dw`). Domaine à acheter pour Resend : aucun e-mail réel ne part tant
   qu'il n'est pas vérifié (`docs/A-DISCUTER-domaine-resend.md`).
6. Sécurité, long terme : à l'inscription, un compte neuf est écrit en base, pas un doublon ; l'écart de durée de
   réponse laisse deviner les adresses inscrites. Accepté pour l'instant (limitation de débit) ; réexamen avant
   ouverture publique large.
