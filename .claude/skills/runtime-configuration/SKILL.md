---
name: runtime-configuration
description: Variables d'environnement et configuration à l'exécution (« build once, run everywhere », interdiction de NEXT_PUBLIC_*, env.ts validé par Zod, configuration publique, pièges de next.config, .env.example). À lire dès qu'on lit process.env, ajoute une variable, une URL ou une clé.
---

# Configuration et variables d'environnement

## Principe

Une image est construite **une fois** ; seules les variables injectées au démarrage changent entre environnements
(preprod, prod). Aucune valeur d'environnement ne doit se retrouver dans la sortie de build.

## Classes de variables

| Classe                     | Exemples                                                                                  | Lue où                                         |
| -------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Secret serveur             | `DATABASE_URL`, `BETTER_AUTH_SECRET`, `RESEND_API_KEY`, clé privée VAPID, secret des jobs | serveur uniquement                             |
| Config serveur non secrète | URL interne de l'API, timeouts, `NODE_ENV`                                                | serveur                                        |
| Config **publique**        | URL publique de l'app, clé publique VAPID                                                 | serveur à la requête, puis transmise au client |
| Constante de build         | SHA du commit                                                                             | build (identique partout)                      |

« Public » n'est pas « secret » : un vrai secret n'est jamais livré au navigateur.

## Règles

1. Interdits : `NEXT_PUBLIC_*` ; `process.env` en dehors des fichiers `env.ts` ; valeur d'environnement dans `next.config.ts`.
2. Un point d'entrée par app : `src/config/env.ts` (`import "server-only"`) avec un schéma Zod, accès **paresseux**
   (`getEnv()`), pour que `next build` n'exige ni secret ni réseau.
3. Échec rapide au démarrage si une variable manque ou est invalide.
4. Moindre privilège : un conteneur ne reçoit que les variables de son `env.ts` (le web n'a pas `DATABASE_URL`).
5. **Jamais de valeur de repli pour un secret** (`process.env.X ?? "secret"`). Absente ⇒ échec. En production, le schéma
   rejette les secrets triviaux ou trop courts.
6. Clés VAPID et secrets **distincts par environnement** (ADR 0006).

Modèle : voir `apps/web/src/config/env.ts`.

## Livrer de la configuration au navigateur (par ordre de préférence)

1. Ne pas en avoir besoin (URLs relatives, `window.location.origin`).
2. Props depuis un Server Component racine qui lit une liste blanche explicite (jamais `...process.env`).
3. Endpoint `GET /api/runtime-config` (dernier recours).

## Pièges Next.js

- `next.config` est figé au build, y compris en `standalone` : `rewrites`, `headers`, `redirects`, `images`.
  Pour atteindre l'API selon l'environnement, utiliser un route handler qui lit l'environnement à la requête.
- Une route sans API dynamique est prérendue au build avec l'environnement du build.

## `.env.example`

Complet, **sans valeur secrète**, groupé par app, chaque variable avec : obligatoire ou optionnelle, exemple factice.
Local : `.env.local` par app, jamais commité (`.gitignore`).

## Tests et lint

ESLint interdit `process.env` hors `env.ts` et `NEXT_PUBLIC_*`. Test « sentinelle » prévu en CI : construire avec des
valeurs `__SENTINEL_<NOM>__` et échouer si l'une apparaît dans la sortie.
