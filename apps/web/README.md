# @planifier/web

Application Next.js 16 (App Router). Port de développement : 3000.

## Structure

```
src/
  app/            # routes : pages minces (composition + chargement), aucune logique
  features/
    account/                # connexion, inscription, déconnexion, utilisateur de la session
    events/ todo/ agenda/   # un dossier par module (components, atoms, forms, stores, queries, index.ts)
    _shared/                # code utilisé par ≥ 2 modules
  lib/            # utilitaires transverses sans métier
  config/env.ts   # seul fichier qui lit process.env (schéma Zod, lecture paresseuse)
```

Règles détaillées : `.claude/skills/feature-first-structure`. Ajouter un module : créer le dossier **et** l'ajouter à
`FEATURES` dans `packages/eslint-config/next.js`.

## API

Le navigateur appelle `/rpc/*` sur l'origine du web ; `src/app/rpc/[...path]/route.ts` relaie vers `API_INTERNAL_URL`,
lue à la requête (ADR 0015). Client typé par le contrat : `src/lib/orpc.ts`, utilisé uniquement dans les `queries/`.
Pour développer : `pnpm dev` à la racine lance le web et l'API.

## Session

- `(auth)/connexion`, `(auth)/inscription` : formulaires du module `account`, appels `fetch` aux routes de Better
  Auth (`/api/auth/*`, corps décrits par `api-contract`) dans `queries/auth.queries.ts`. Avec une session : retour à `/`.
- `(app)/*` : réservé aux comptes connectés. `getCurrentUser()` (serveur, `cache`) appelle `account.me.get` sur
  l'API interne avec le cookie et l'IP de la requête (`lib/orpc.server.ts`) ; sans session, redirection.
- Session expirée côté navigateur : `UNAUTHORIZED` sur n'importe quel appel ⇒ cache vidé, retour à la connexion
  (`lib/query-provider.tsx`). Chaque connexion, inscription ou déconnexion vide aussi le cache.
- L'autorité reste l'API : les redirections ne protègent aucune donnée.

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
| `pnpm --filter @planifier/web test`        | Vitest (jsdom pour les composants)             |

## Variables d'environnement

Voir `.env.example` à la racine et `src/config/env.ts`. Polices : chargées par `next/font` (Bricolage Grotesque, DM Sans).
