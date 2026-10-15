# 0012 — Organisation feature-first de apps/web

Statut : accepté · Date : 2026-10-15

Contexte : trois modules distincts (Événements, Todo, Agenda), activables à la carte. La logique et les
composants doivent être faciles à trouver, à appeler partout et à faire évoluer.

Décision : `apps/web/src/features/<module>/` porte tout ce qui est propre à un module
(`components`, `atoms`, `forms`, `stores`, `queries`, `index.ts`). `features/_shared` accueille le code utilisé par
au moins deux modules. Les composants sans connaissance métier vivent dans `packages/ui`, hors des apps. Les pages
de `app/` sont minces. Sens unique : `app/` → `features/` → `packages/*`. Un module n'importe jamais un autre module.
La règle est **outillée** (ESLint, `packages/eslint-config`), pas seulement écrite.

Alternatives écartées : organisation par type technique (`components/`, `hooks/` globaux) — disperse un module sur
tout l'arbre ; un package par module — prématuré, à reconsidérer si un module doit être déployé seul.

Conséquences : ajouter un module = un dossier + une ligne dans `FEATURES` (`eslint-config/next.js`). Les
composants partagés par ≥ 3 modules sans métier montent dans `packages/ui`.
