# @planifier/api-server

Serveur HTTP de l'API : `http.createServer` de Node et l'adaptateur `@orpc/server/node`, routeur de `@planifier/api`
monté sous `/rpc`, 404 ailleurs (ADR 0015). Port par défaut : 3001.

Exécuté avec `node --import tsx` : les packages du workspace exportent du TypeScript source, pas de bundle.

## Comportement

- Corps limité à 1 Mo (`BodyLimitPlugin`).
- Une ligne JSON par requête : identifiant, méthode, chemin (sans la query, qui porte l'entrée), statut, durée.
  Erreurs ≥ 500 journalisées par nom (détail hors production seulement).
- `x-request-id` repris s'il est fourni par le proxy du web, généré sinon.
- Arrêt propre sur `SIGTERM` / `SIGINT`.

## Commandes

| Commande                                    | Action                                       |
| ------------------------------------------- | -------------------------------------------- |
| `pnpm --filter @planifier/api-server dev`   | serveur avec rechargement (lit `.env.local`) |
| `pnpm --filter @planifier/api-server start` | serveur                                      |
| `pnpm --filter @planifier/api-server test`  | test du serveur via un client typé           |

Variables : `apps/api/src/config/env.ts` et `.env.example`.
