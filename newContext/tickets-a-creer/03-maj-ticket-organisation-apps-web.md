# MAJ du ticket « Organisation modulaire de apps/web »

- **Ticket ClickUp existant** : https://app.clickup.com/t/869fhwtbz (liste 00 · Socle & infra)
- **Action** : remplacer sa description par le texte ci-dessous (limite d'appels MCP ClickUp atteinte lors de la mise à jour).

---

Définir et poser l'arborescence de `apps/web`, en suivant le principe **feature-first** (grandes lignes d'OVC uniquement, rien copié).

```
apps/web/src/
  app/                  # routes Next : pages MINCES, aucune logique
  features/
    events/             # un dossier par module
    todo/
    agenda/
      components/       # composition d'écran ou de section
      atoms/            # composants métier propres au module
      forms/
      stores/           # état d'UI uniquement (dialogues, sélection)
      queries/          # SEUL endroit qui appelle l'API (hooks TanStack Query)
      types.ts · constants.ts
      index.ts          # exports publics du module
    _shared/            # code utilisé par au moins 2 modules
  lib/ · config/
packages/ui/            # composants sans connaissance métier, réutilisables partout
```

## Règles
- Sens unique : `app/` → `features/` → `packages/*`.
- Un module n'importe jamais un autre module, sauf via `_shared` ou son `index.ts` public.
- Les composants n'appellent pas l'API : ils passent par `queries/`.
- Un composant sans connaissance métier utilisé 3 fois dans des modules différents est promu dans `packages/ui`.
- Règles appliquées par ESLint (`eslint-plugin-boundaries`).
- Documenter dans un README court.

## Critères
Arborescence vide mais compilable ; règles d'import vérifiées par le lint.
