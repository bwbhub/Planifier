# @planifier/eslint-config

ESLint 9 (flat config) partagé. Le lint **bloque** (`--max-warnings 0`) : pas de `eslint-plugin-only-warn`.

| Export                          | Pour                                                         |
| ------------------------------- | ------------------------------------------------------------ |
| `@planifier/eslint-config/base` | packages TypeScript                                          |
| `@planifier/eslint-config/next` | apps Next (ajoute React, hooks, Next, isolation des modules) |

```js
// eslint.config.js d'un package
import { baseConfig } from "@planifier/eslint-config/base";
export default baseConfig(import.meta.dirname);
```

## Ce que le lint garantit

- TypeScript `strictTypeChecked` ; `any`, `!`, assertions `as`, `@ts-ignore` interdits (`@ts-expect-error` avec description).
- `process.env` lu **uniquement** dans `env.ts` ; `NEXT_PUBLIC_*` interdit.
- Pas d'export par défaut (sauf pages/layouts/configs).
- Taille et complexité bornées : fichier ≤ 500 lignes, fonction ≤ 80 lignes, complexité ≤ 10, ≤ 4 paramètres.
- **Isolation des modules** (`events`, `todo`, `agenda`) : un module n'importe ni un autre module ni `app/`.
- Bibliothèques écartées (MUI, Express, jsonwebtoken, bcryptjs) refusées à l'import.

## Ajouter un module

Ajouter son nom à `FEATURES` dans `next.js` : l'isolation s'applique aussitôt.

## Dérogation connue

ESLint reste en 9.x : `eslint-plugin-react` n'accepte pas ESLint 10 (voir `.claude/skills/project-context`).
