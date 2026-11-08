# @planifier/domain-ical

Lecture et écriture de flux iCal (RFC 5545) : fonctions **pures**. Aucun accès réseau, base ni horloge (« maintenant »
est fourni par l'appelant). Écrit à la main, sans bibliothèque iCal (pas de dépendance ; `ical.js` est en MPL-2.0).
Décision d'ensemble : ADR 0011 (upsert sur `(source, uid)`, anti-boucle).

## API publique

- `@planifier/domain-ical/parse` : `parseFeed(texte)` ⇒ `{ events, ignored }`. Lit `VEVENT` (titre, lieu, description,
  jours entiers ou instants, fuseaux IANA, durées), la répétition (`RRULE`, `EXDATE`, `RECURRENCE-ID`) **sans la
  développer**. Écarte les annulés, les illisibles et nos propres exports, et les compte.
- `@planifier/domain-ical/plan` : `planUpsert(existantes, reçues)` ⇒ `{ create, update, unchanged, removed }`, par `uid`.
- `@planifier/domain-ical/render` : `renderFeed(entrées, maintenant)` ⇒ texte iCal marqué (`PRODID` et
  `X-PLANIFIER-ORIGIN`), relu par `parseFeed` il est ignoré.
- `@planifier/domain-ical/types` : `ImportedEntry`, `FeedEvent`, `ExportEntry`, `EntryTime`.

## Choix de lecture

- `DTEND` d'un jour entier est exclusif en iCal ; `endDay` de l'Agenda est inclus : converti à la lecture et à l'écriture.
- Heure « flottante » (ni `Z` ni `TZID`) : lue comme UTC. Fuseau inconnu : l'événement est écarté (`invalid`).
- Champs bornés aux longueurs de l'Agenda (`@planifier/constants/agenda`) ; titre vide ⇒ « Sans titre ».

Dépend de `@planifier/constants` seulement.
