# @planifier/web

Application Next.js 16 (App Router). Port de développement : 3000.

## Structure

```
src/
  app/            # routes : pages minces (composition + chargement), aucune logique
  features/
    events/ todo/ agenda/   # un dossier par module (components, atoms, forms, stores, queries, index.ts)
    _shared/                # code utilisé par ≥ 2 modules
  lib/            # utilitaires transverses sans métier
  config/env.ts   # seul fichier qui lit process.env (schéma Zod, lecture paresseuse)
```

Règles détaillées : `.claude/skills/feature-first-structure`. Ajouter un module : créer le dossier **et** l'ajouter à
`FEATURES` dans `packages/eslint-config/next.js`.

## Règles clés (vérifiées par le lint)

- Un module n'importe jamais un autre module ni `app/` ; l'app n'importe jamais `api`, `db`, `auth`, `mails`.
- Pas de `process.env` hors `env.ts`, pas de `NEXT_PUBLIC_*` (build once, run everywhere).
- Styles par tokens (`bg-surface`, `text-muted`…) ; jamais de couleur en dur.

## Commandes

| Commande                                   | Action                                         |
| ------------------------------------------ | ---------------------------------------------- |
| `pnpm --filter @planifier/web dev`         | serveur de développement                       |
| `pnpm --filter @planifier/web build`       | build (sortie `standalone`, prête pour Docker) |
| `pnpm --filter @planifier/web check-types` | `next typegen` puis `tsc`                      |
| `pnpm --filter @planifier/web lint`        | ESLint, 0 avertissement                        |

## Variables d'environnement

Voir `.env.example` à la racine et `src/config/env.ts`. Polices : chargées par `next/font` (Bricolage Grotesque, DM Sans).
