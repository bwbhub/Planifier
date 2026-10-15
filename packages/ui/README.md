# @planifier/ui

Composants **sans connaissance métier**, réutilisables partout (web aujourd'hui, autres apps demain).

## État

Seul `lib/cn` existe. Les composants (bouton, champ, onglets, carte, navigation, avatar…) arrivent avec le ticket
« Design system » (ClickUp, liste 02), d'après la maquette « Doux et vivant ».

## Règles

- Aucune donnée, aucun appel réseau, aucun store, aucun contrat d'API : tout arrive par props.
- Styles par tokens (`@planifier/tokens`) uniquement ; clair et nuit ; cibles tactiles ≥ 44 px.
- Import par chemin explicite : `import { cn } from "@planifier/ui/lib/cn"`. Pas de barrel géant.
- Un composant sans métier utilisé 3 fois dans des modules différents est promu ici (PR dédiée).

Détails : `.claude/skills/ui-design-system`.
