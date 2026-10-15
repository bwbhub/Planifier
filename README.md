# Planifier

Todo, agenda et événements, **à la carte**. Chaque personne active les modules qu'elle veut ; des Espaces (couple,
colocation, vacances) permettent de partager.

> Refonte en cours (v2). Vocabulaire : [`CONTEXT.md`](CONTEXT.md). Décisions : [`docs/adr/`](docs/adr).
> Règles pour développeurs et agents : [`AGENTS.md`](AGENTS.md).

## Stack

| Couche                     | Technologie                                       |
| -------------------------- | ------------------------------------------------- |
| Monorepo                   | pnpm + Turborepo                                  |
| Web                        | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Langage                    | TypeScript strict (`any` interdit)                |
| API _(à venir)_            | oRPC + contrats Zod, TanStack Query côté web      |
| Auth _(à venir)_           | Better Auth (cookies httpOnly)                    |
| Base _(à venir)_           | PostgreSQL (Neon) + Prisma 7                      |
| E-mails / push _(à venir)_ | React Email + Resend, Web Push (VAPID)            |

## Structure

```
apps/
  web/                    # Next.js — un dossier par module dans src/features/
    src/app/              # routes : pages minces
    src/features/
      events/ todo/ agenda/   # les 3 modules (components, atoms, forms, stores, queries)
      _shared/                # code utilisé par ≥ 2 modules
    src/lib/ src/config/      # utilitaires, env.ts
packages/
  constants/              # rôles, statuts, énumérations (feuille du graphe)
  tokens/                 # design tokens clair/nuit « Doux et vivant »
  ui/                     # composants sans connaissance métier, réutilisables partout
  eslint-config/          # lint partagé (porte aussi l'isolation des modules)
  typescript-config/      # tsconfig partagés
docs/
  adr/                    # décisions d'architecture
  DEPENDANCES.md          # fiches de décision des dépendances
.claude/skills/           # règles détaillées par sujet (lues par les agents)
back/ front/              # ANCIEN code, lecture seule, retiré module par module
```

## Démarrer

Prérequis : Node ≥ 20.9, pnpm ≥ 10.16 (`corepack enable`).

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

| Commande                            | Action                                                                               |
| ----------------------------------- | ------------------------------------------------------------------------------------ |
| `pnpm dev`                          | lance les apps en développement                                                      |
| `pnpm build`                        | build de production                                                                  |
| `pnpm check-types`                  | typage de tout le workspace                                                          |
| `pnpm lint`                         | lint (0 avertissement toléré)                                                        |
| `pnpm test`                         | tests                                                                                |
| `pnpm format`                       | formate avec Prettier                                                                |
| `pnpm legacy:back` / `legacy:front` | lance l'ancien code (réinstaller ses dépendances : `npm --prefix <dossier> install`) |

## Parcours nouveau développeur

1. Ce README, puis [`CONTEXT.md`](CONTEXT.md) (le vocabulaire).
2. [`AGENTS.md`](AGENTS.md), puis `.claude/skills/project-context/SKILL.md`.
3. Le README de l'app ou du package touché.
4. Avant une fonctionnalité : `.claude/skills/feature-delivery-workflow/SKILL.md`.
