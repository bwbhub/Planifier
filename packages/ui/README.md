# @planifier/ui

Composants **sans connaissance métier**, réutilisables partout (web aujourd'hui, autres apps demain).

## État

- `lib/cn` : assemblage de classes.
- `components/button` : `Button` (`variant` `primary` | `secondary`, `type="button"` par défaut, cible ≥ 44 px).
- `components/text-field` : `TextField` (libellé, aide et erreur reliés au champ, `aria-invalid`).

Les autres composants (onglets, carte, navigation, avatar…) arrivent avec le ticket « Design system » (ClickUp,
liste 02), d'après la maquette « Doux et vivant ».

## Tests

`pnpm --filter @planifier/ui test` : Vitest + jsdom + Testing Library ; un test d'interaction et un contrôle axe-core
par composant (contraste exclu : jsdom ne calcule pas les couleurs, il est garanti par les tokens).

## Règles

- Aucune donnée, aucun appel réseau, aucun store, aucun contrat d'API : tout arrive par props.
- Styles par tokens (`@planifier/tokens`) uniquement ; clair et nuit ; cibles tactiles ≥ 44 px.
- Import par chemin explicite : `import { Button } from "@planifier/ui/components/button"`. Pas de barrel géant.
- Un composant sans métier utilisé 3 fois dans des modules différents est promu ici (PR dédiée).

Détails : `.claude/skills/ui-design-system`.
