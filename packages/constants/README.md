# @planifier/constants

Rôles, statuts et énumérations métier partagés. **Feuille du graphe** : aucune dépendance.

## Règle

Un ensemble fermé et stable vit ici sous forme de tableau `as const` + type dérivé.
Le vocabulaire suit `CONTEXT.md` (racine du dépôt).

## Interdits

Aucun import externe, aucun code qui s'exécute (pas d'effet de bord), pas de logique métier
(elle va dans un package `domain-*`).
