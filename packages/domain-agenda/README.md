# @planifier/domain-agenda

Affichage de l'agenda : fonctions **pures**. Aucun accès base, réseau ni horloge : « aujourd'hui » est toujours fourni
par l'appelant, et les jours sont des jours civils `AAAA-MM-JJ`, sans fuseau.

## API publique

- `@planifier/domain-agenda/view-days` : `viewDays(vue, jour)`, jours affichés (la semaine commence le lundi, le mois
  couvre des semaines entières) ; `stepDay(vue, jour, sens)`, jour de la période précédente ou suivante, sans
  glissement des fins de mois.
- `@planifier/domain-agenda/layout` : `layoutOverlaps(créneaux)`, colonne de chaque créneau d'une journée, pour que des
  créneaux qui se chevauchent se placent côte à côte.

Vues et bornes : `@planifier/constants/agenda`. Dépend de `@planifier/constants` seulement.
