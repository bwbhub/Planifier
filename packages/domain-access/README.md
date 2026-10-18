# @planifier/domain-access

Droits : fonctions **pures** `(appelant, ressource, action) → autorisé` (ADR 0009, 0014). Testées par une matrice exhaustive.

## API publique

- `@planifier/domain-access/resource` : `canAccessResource`, `resourceLevel` (liste, entrée d'agenda).
- `@planifier/domain-access/event` : `canAccessEvent` (rôles OWNER, ORGANIZER, GUEST).

L'appelant fournit des données déjà lues (rôle d'Espace, partage, rôle de participant). Le package ne lit rien.
`read`/`view` faux ⇒ l'API répond `NOT_FOUND`.

## Règles retenues

- Propriétaire : tous les droits sur sa ressource. Membre d'Espace : niveau `spaceLevel` (READ par défaut, WRITE pour une
  liste partagée, NONE si l'Espace restreint la visibilité). Le plus élevé du partage direct et de l'Espace l'emporte.
- Suppression : propriétaire, ou propriétaire d'Espace qui voit la ressource. Partage : propriétaire seul.
- Événement : voir `src/event.ts`. Reprise de propriété par un co-organisateur seulement si le propriétaire est parti.

## Interdits

Aucun accès base, réseau ni horloge ; dépend de `@planifier/constants` seulement.
