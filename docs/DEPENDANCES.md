# Dépendances — fiches de décision

Règle : aucune dépendance sans fiche (`.claude/skills/dependency-governance`). Un agent **propose**, un humain
**valide**. Versions centralisées dans `pnpm-workspace.yaml` (`catalog:`). Vérifié le 2026-10-15 (registre npm).

Critères : licence autorisée (MIT, Apache-2.0, BSD, ISC), release < 12 mois, types inclus, compatible avec nos
versions majeures, pas de doublon. Chaîne d'approvisionnement : `minimumReleaseAge` = 3 jours, scripts
d'installation limités à `sharp` et `unrs-resolver`, `--frozen-lockfile` en CI.

## Installées (squelette)

| Dépendance                                  | Version    | Cible                   | Besoin                                           | Licence    | Dernière release               | Alternative écartée                                |
| ------------------------------------------- | ---------- | ----------------------- | ------------------------------------------------ | ---------- | ------------------------------ | -------------------------------------------------- |
| turbo                                       | 2.11       | racine                  | orchestration des tâches du monorepo             | MIT        | 2026-10-13                     | Nx (plus lourd)                                    |
| typescript                                  | **6.0.x**  | tous                    | langage                                          | Apache-2.0 | 6.0.3                          | 7.0 : refusé par `typescript-eslint` (peer `<6.1`) |
| prettier                                    | 3.9        | racine                  | formatage                                        | MIT        | 2026-10-10                     | Biome (outil de plus)                              |
| eslint                                      | **9.39.x** | tous                    | lint                                             | MIT        | 2026-10                        | 10.x : refusé par `eslint-plugin-react` (peer ≤ 9) |
| @eslint/js                                  | 9.39       | eslint-config           | règles recommandées                              | MIT        | 2026                           | —                                                  |
| typescript-eslint                           | 8.71       | eslint-config           | lint TypeScript strict                           | MIT        | 2026-10-12                     | —                                                  |
| eslint-config-prettier                      | 10.1       | eslint-config           | éviter les conflits lint/format                  | MIT        | 2025-07                        | —                                                  |
| eslint-plugin-react                         | 7.37       | eslint-config           | règles React                                     | MIT        | 2025-04                        | —                                                  |
| eslint-plugin-react-hooks                   | 7.1        | eslint-config           | règles des hooks                                 | MIT        | 2026-04                        | —                                                  |
| @next/eslint-plugin-next                    | 16.4       | eslint-config           | règles Next                                      | MIT        | 2026-10-14                     | —                                                  |
| globals                                     | 17.13      | eslint-config           | globales navigateur/Node                         | MIT        | 2026-10                        | —                                                  |
| next                                        | 16.4       | apps/web                | framework web (App Router)                       | MIT        | 2026-10-14                     | — (décision ADR 0002)                              |
| react / react-dom                           | 19.3       | web, ui                 | UI                                               | MIT        | 2026-10-14                     | —                                                  |
| zod                                         | 4.6        | web, db (puis contrats) | validation aux frontières                        | MIT        | 2026-10-12                     | — (ADR 0003)                                       |
| server-only                                 | 0.0.1      | web                     | interdit l'import serveur côté client (`env.ts`) | MIT        | stable                         | —                                                  |
| tailwindcss, @tailwindcss/postcss, postcss  | 4.3 / 8.5  | web                     | styles (ADR 0008)                                | MIT        | 2026-07 / 10                   | —                                                  |
| clsx                                        | 2.1        | ui                      | assembler des classes                            | MIT        | 2024-04 (stable, 0 dépendance) | —                                                  |
| tailwind-merge                              | 3.7        | ui                      | résoudre les conflits de classes Tailwind        | MIT        | 2026-09                        | —                                                  |
| @types/node, @types/react, @types/react-dom | 24 / 19.3  | tous                    | types                                            | MIT        | 2026                           | —                                                  |

**Retirée en cours de route** : `eslint-plugin-boundaries` (aurait imposé un résolveur d'imports en plus).
L'isolation des modules est faite avec `no-restricted-imports`, déjà fourni par ESLint.

## Dérogations de version

| ID  | Dépendance             | Raison                                                                   | Réexamen                                                                |
| --- | ---------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| D1  | TypeScript 6.0 (pas 7) | `typescript-eslint` : `typescript <6.1`                                  | à la prochaine version de `typescript-eslint`                           |
| D2  | ESLint 9 (pas 10)      | `eslint-plugin-react` : peer ESLint ≤ 9 ; npm signale 9.x « deprecated » | à la sortie d'une version de `eslint-plugin-react` compatible ESLint 10 |

## Fiches validées et installées : `packages/db` (ticket « Package db »)

Vérifié le 2026-10-15 (registre npm). Fiches validées par l'équipe puis installées via le `catalog:`.

```
Dépendance : prisma@~7.10.0                Cible : packages/db         Type : dev
Besoin : CLI (generate, migrate, validate, format) du schéma PostgreSQL.
Doublon ? : non.
Licence : Apache-2.0
Maintenance : 7.10.0 publiée le 2026-08-25 (7.10.1 du 2026-10-15 écartée : sous le seuil `minimumReleaseAge`) · Prisma Data, dépôt actif.
Poids : outil de build uniquement, absent du runtime · scripts d'installation : `prisma` et `@prisma/engines`, autorisés dans `onlyBuiltDependencies`.
Piège : le tag `latest` du paquet `prisma` est la 8.0.0-rc.23 → épingler `~7.10.0` (ADR 0005), pas de `pnpm add prisma` nu.
Alternative écartée : Drizzle (ADR 0005 : Prisma décidé).
Sortie : coût élevé (toute la couche d'accès), mais bornée à `db`.
```

```
Dépendance : @prisma/client@~7.10.0        Cible : packages/db         Type : prod
Besoin : client typé généré (générateur `prisma-client`), importé par `db` et `api` uniquement.
Doublon ? : non. Licence : Apache-2.0. Maintenance : 7.10.0 du 2026-08-25, même dépôt que la CLI.
Poids : client généré dans le dépôt (sans moteur Rust avec Prisma 7) · scripts d'installation : non attendus.
Alternative écartée : SQL brut (pas de typage de bout en bout, règle 4).
Sortie : liée à Prisma.
```

```
Dépendance : @prisma/adapter-pg@~7.10.0    Cible : packages/db         Type : prod
Besoin : Prisma 7 exige un driver adapter ; PostgreSQL « pur » reste portable (Neon, local, autre : ADR 0005).
Doublon ? : non. Licence : Apache-2.0. Maintenance : 7.10.0 du 2026-08-25.
Poids : tire `pg` 8.x (MIT, déjà la référence Node) et `@types/pg` · scripts d'installation : non.
Alternative écartée : @prisma/adapter-neon (dépendance à l'hébergeur, interdit par l'ADR 0005).
Sortie : faible (une ligne dans `client.ts`).
```

```
Dépendance : tsx@~4.23.15                  Cible : packages/db         Type : dev
Besoin : exécuter le seed TypeScript (`tsx prisma/seed.ts`).
Doublon ? : non. Licence : MIT. Maintenance : 4.23.15 du 2026-09-20.
Poids : embarque esbuild (script d'installation d'esbuild autorisé dans `onlyBuiltDependencies`).
Alternative écartée : `node --experimental-strip-types` (contredit `engines.node >=20.9`, imports en `.ts`
  obligatoires). À reconsidérer si on relève Node à >=22.18 : tsx disparaîtrait.
Sortie : faible.
```

```
Dépendance : vitest@~5.0.4                 Cible : packages/db (puis chaque package)   Type : dev
Besoin : tests de la logique pure (droits, doublons iCal, soldes, récurrence), de `getDbEnv` et du garde du seed.
Doublon ? : non. Licence : MIT. Dépôt : vitest-dev/vitest.
Maintenance : 5.0.4 publiée le 2026-10-12 (5.0.5 du 2026-10-15 écartée : sous le seuil `minimumReleaseAge`).
Poids : environ 2,8 Mo décompressé, 13 dépendances directes · scripts d'installation : non.
Prérequis : Node ^22.12 || ^24 (Vite en peer, installé par pnpm).
Alternative écartée : Jest (configuration TypeScript plus lourde, ESM moins bien géré).
Sortie : faible.
```

`server-only` (déjà au catalog, fiche « Installées ») est ajouté à `db` : le client Prisma ne doit jamais atteindre le navigateur.
Pas de `dotenv` : le seed charge `.env.local` par `node --env-file-if-exists`, et `prisma.config.ts` passe par
`getCliDatabaseUrl()` (`src/env.ts`, `process.loadEnvFile`) : `process.env` n'est lu que dans `env.ts` (règle 8).

**Écarté : génération de Zod depuis Prisma** (`zod-prisma-types`, `prisma-zod-generator`, générateur maison). Le premier
produisait un fichier inutilisable avec Prisma 7 (import du client Prisma, chemin faux), le deuxième est lourd
(`postinstall`, express), le troisième est du code à maintenir. Les DTO de l'API sont écrits à la main dans
`api-contract` ; les enums viennent de `@planifier/constants`. Plus de package `db-types`.

## À venir (ne pas installer avant validation de sa fiche)

| Dépendance                                         | Version visée | Point d'attention                                           |
| -------------------------------------------------- | ------------- | ----------------------------------------------------------- |
| @orpc/* (server, contract, client, tanstack-query) | 1.15.x        | ADR 0003                                                    |
| @tanstack/react-query                              | 5.x           | état serveur côté web                                       |
| better-auth                                        | 1.7.x         | ADR 0004 ; vérifier le plugin d'organisations pour l'Espace |
| web-push, resend, @react-email/*                   | à choisir     | ADR 0010 ; domaine à acheter pour Resend                    |
| @playwright/test                                   | à choisir     | tests E2E (décision technique 14)                           |
