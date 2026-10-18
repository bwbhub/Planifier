# @planifier/api-contract

Contrats oRPC de l'API (ADR 0003) : schémas Zod d'entrée et de sortie, une description par procédure. Source unique des
types côté serveur (`api`) et côté client (`apps/web`).

## API publique

- `contract` : contrat complet (`system.health.get`…).
- `ApiClient` : type du client, dérivé du contrat.
- Types de sortie (`HealthOutput`…).

Arborescence : `src/features/<domaine>/<feature>/<feature>.schemas.ts` puis `<feature>.contract.ts`, assemblés dans
`src/index.ts`.

## Interdits

Importé par le navigateur : aucune dépendance serveur (`@orpc/server`, `db`, `auth`, `mails`, `api`, `node:*`).
Vérifié par le lint. Changements additifs uniquement (règle 10).
