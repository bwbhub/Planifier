# 0015 — Serveur d'API en Node natif, atteint par un proxy même origine

Statut : accepté · Date : 2026-10-18

Contexte : l'API oRPC (ADR 0003) est une app séparée (une image par app, ADR 0006). Le navigateur doit l'atteindre
sans valeur d'environnement dans le build (règle 8) et, plus tard, avec un cookie de session httpOnly (ADR 0004).

Décision :

- `apps/api` : `http.createServer` de Node et l'adaptateur `@orpc/server/node`, sans framework HTTP. Exécuté avec
  `node --import tsx` (les packages exportent du TypeScript source).
- Découpage : `api-contract` (contrats, importable par le navigateur) · `api` (routeur, gardes, services) ·
  `apps/api` (serveur mince).
- Le navigateur appelle `/rpc/*` sur l'origine du web ; un route handler de `apps/web` relaie vers
  `API_INTERNAL_URL`, lue à la requête. En-têtes relayés en liste blanche (`accept`, `content-type`, `cookie`).

Conséquences : cookies first-party, pas de CORS, rien de propre à l'environnement dans le build. Un saut réseau de plus
par appel. Better Auth se montera de la même façon (`toNodeHandler` côté API, route relayée côté web). Écartés : Hono
(deux paquets pour un seul besoin), appel direct de l'API avec CORS (cookies entre origines, URL publique à livrer au
navigateur).
