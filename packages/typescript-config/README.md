# @planifier/typescript-config

Configurations `tsconfig` partagées. Chaque app et chaque package **étend** l'une d'elles.

| Fichier        | Pour                              |
| -------------- | --------------------------------- |
| `base.json`    | tout (Node, logique pure)         |
| `library.json` | packages utilisant React / le DOM |
| `nextjs.json`  | `apps/web`                        |

## Ce qui est activé (et pourquoi)

`strict`, `noUncheckedIndexedAccess` (un index de tableau peut être `undefined`), `exactOptionalPropertyTypes`
(`?:` n'accepte pas `undefined` explicite), `verbatimModuleSyntax` (imports de types explicites),
`noImplicitOverride`, `noFallthroughCasesInSwitch`.

## Interdits

Ne pas assouplir une option pour faire passer un fichier : on corrige le fichier
(skill `typescript-strictness`). Une dérogation passe par `.claude/skills/project-context`.
