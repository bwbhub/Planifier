# @planifier/domain-events

Règles des événements : fonctions **pures**. Aucun accès base, réseau ni horloge : « maintenant » et « aujourd'hui »
sont toujours fournis par l'appelant, et les jours sont des jours civils `AAAA-MM-JJ`, sans fuseau.

## API publique

- `@planifier/domain-events/when` : `EventWhen` (horaire, avec ou sans fin choisie, ou à la journée) ;
  `startKeyOf(when)`, clé de tri et de pagination de la colonne `Event.startKey` ; `isUpcoming(when, { now, today })`,
  « à venir » (un événement en cours l'est encore) ou « passé ».
- `@planifier/domain-events/changes` : `importantChanges(avant, après)`, les champs importants modifiés (date et
  heure, lieu) : chacun donne un message « Changement » dans les commentaires. Le titre et les infos ne comptent pas.
- `@planifier/domain-events/capacity` : `goingCount(…)` (participants et invités sans compte qui y vont) ;
  `hasRoomFor(…)` (reste-t-il une place pour « J'y vais » ?).

Les droits (`canAccessEvent`…) sont dans `@planifier/domain-access/event`. Dépend de `@planifier/constants` seulement.
