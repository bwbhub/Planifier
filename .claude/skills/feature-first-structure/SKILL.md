---
name: feature-first-structure
description: Organisation feature-first de apps/web (un dossier par module events/todo/agenda, atoms vs packages/ui, règles d'import, pages minces). À lire pour créer une fonctionnalité, placer un fichier ou ajouter un composant métier, un store ou un hook de données.
---

# Organisation feature-first

## Arbre type

```
apps/web/src/
  app/                    # routes Next : pages MINCES (composition + chargement), aucune logique
  features/
    <module>/             # account | spaces | events | todo | agenda
      components/         # composition d'écran ou de section (dialogues, vues)
      atoms/              # composants métier réutilisés dans le module, absents de `ui`
      forms/              # formulaires (un seul pour création et modification)
      stores/             # état d'UI (dialogue ouvert, sélection) — jamais de donnée serveur
      queries/            # SEUL endroit qui appelle l'API (hooks TanStack Query)
      types.ts · constants.ts · utils/   # seulement si nécessaire
      index.ts            # exports publics du module
    _shared/              # code utilisé par ≥ 2 modules
  lib/                    # utilitaires transverses sans métier
  config/                 # env.ts
packages/ui/              # composants sans connaissance métier, réutilisables partout
```

## Où va un fichier ?

| Question                                            | Destination                                |
| --------------------------------------------------- | ------------------------------------------ |
| Connaît un type du contrat ou une règle métier ?    | `atoms/` ou `components/` du module        |
| Aucune connaissance métier, réutilisable partout ?  | `packages/ui`                              |
| Utilisé par ≥ 2 modules ?                           | `features/_shared/`                        |
| Utilisé par ≥ 2 apps ?                              | un package (voir `workspace-architecture`) |
| Appelle l'API ?                                     | `queries/` uniquement                      |
| État d'interface (dialogue, sélection) ?            | `stores/`                                  |
| Calcul ou règle pure (récurrence, droits, soldes) ? | package `domain-*`                         |

Un composant promu à 3 usages dans des modules différents, sans connaissance métier, devient candidat `ui` (PR dédiée).

## Règles d'import (vérifiées par le lint)

- Sens unique : `app/` → `features/` → `packages/*`. Une feature n'importe jamais `app/`.
- Un module n'importe **pas** un autre module ; il passe par `_shared` ou un package. Un module expose son entrée
  publique par `index.ts`.
- `components/` et `atoms/` n'appellent pas l'API : ils utilisent les hooks de `queries/`.
- Alias `@/` = `src/`. Imports de `packages/*` via leurs `exports` publics.

## Conventions

- Une finalité par fichier, reflétée par le suffixe : `event.schemas.ts`, `events.queries.ts`, `event-dialog.store.ts`,
  `event-form.tsx`, `*.test.ts`. Noms en kebab-case, composants en PascalCase.
- Composants serveur par défaut ; `"use client"` au plus bas niveau utile (feuilles interactives), jamais sur une page
  entière sans raison.
- Une page mince : lit les paramètres, précharge, rend une vue du module.
- Pas d'export par défaut (hors pages Next) ; pas de barrel géant.
- Dialogues : un store par module `{ open, entityId | null, openCreate(), openEdit(id), close() }` ; pas de dialogue
  dupliqué création/modification.

## Ajouter une fonctionnalité (ordre)

Contrat/procédure → `queries/` → `stores/` si état d'UI → `forms/` → `components/`/`atoms/` → page mince → tests.
Chercher d'abord dans `_shared`, les `atoms` voisins et `ui` avant de créer.

## Ajouter un module

Créer `features/<module>/` et ajouter son nom à `FEATURES` dans `packages/eslint-config/next.js`.

## Anti-patrons

Appel API dans un composant ; composant copié entre modules ; store qui duplique le cache serveur ; import profond
dans un autre module ; page de 300 lignes ; dossier `utils/` fourre-tout (nommer par finalité).
