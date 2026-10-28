# @planifier/domain-recurrence

Répétition des tâches : fonctions **pures** (ADR 0017). Aucun accès base, réseau ni horloge : « aujourd'hui » est
toujours fourni par l'appelant.

## API publique

- `nextDueDate(règle, échéance | null, aujourd'hui)` : prochaine échéance quand on coche une tâche répétée, première
  occurrence strictement après aujourd'hui, comptée depuis l'échéance (sans glissement des fins de mois).
- Type `Recurrence` (`frequency`, `interval`). Rythmes et bornes : `@planifier/constants/todo`.

- `@planifier/domain-recurrence/stored` : `toStoredRecurrence`, `fromStoredRecurrence` (colonne JSON versionnée,
  `schemaVersion`), validée en écriture et en lecture.

Dépend de `@planifier/constants` et `zod` seulement.
