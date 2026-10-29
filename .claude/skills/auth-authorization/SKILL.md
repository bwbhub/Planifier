---
name: auth-authorization
description: Authentification (Better Auth) et autorisation (Espaces, rôles d'événement, partage par ressource, invitations par token). À lire pour tout ce qui touche session, droits, invitation ou visibilité. Conventions visées : les packages auth et domain-access n'existent pas encore.
---

# Authentification et droits

Relecture humaine obligatoire pour toute PR qui touche ce sujet.

## Authentification (ADR 0004)

Better Auth, session par **cookie httpOnly**, aucun JWT en `localStorage`, aucun secret par défaut dans le code.
Google OAuth ajouté plus tard via la même bibliothèque. Aucun compte de l'ancienne app n'est repris. Mots de passe : jamais
journalisés ni renvoyés.

## Modèle de droits (ADR 0009, 0014)

- **Espace** : couple, colocation, vacances. Membres égaux par défaut. À 2 membres : double propriétaire ; au-delà, le
  créateur est propriétaire et peut en nommer d'autres. Le créateur est protégé (ni rétrogradé ni retiré) tant qu'il
  est membre ; gestion de l'Espace aux propriétaires, un membre voit et quitte (`domain-access/space`).
- **Hors Espace** : liste, agenda, événement = personnel et privé.
- **Événement** : rôles `OWNER`, `ORGANIZER`, `GUEST` (toujours présents). Le propriétaire active/désactive les briques ;
  un co-organisateur active des briques, assigne, valide les propositions ; un invité voit et réagit.
- **Partage par ressource** : `NONE` / `READ` / `WRITE` (liste perso partageable en lecture seule).
- **Liste partagée** (`domain-access/todo-list`) : rattachée à un Espace, ouverte en écriture à tous ses membres,
  même dans un Espace restreint (décision du 2026-10-29).
- **Invité sans compte** : accès par token d'invitation lié à l'adresse e-mail ; ne reçoit **jamais** de notification.

## Règles

1. Les droits sont des **fonctions pures** `(utilisateur, ressource, action) → autorisé` dans `domain-access`, testées par
   une matrice exhaustive.
2. Toute lecture ou écriture est filtrée par les droits de l'appelant. Un id enfant seul ne suffit pas : vérifier la
   ressource parente.
3. Sans droit de lecture ⇒ `NOT_FOUND` (ne pas révéler l'existence) ; ressource visible mais action refusée ⇒
   `FORBIDDEN` (ADR 0014).
4. L'utilisateur vient de la session, jamais de l'entrée ni d'un en-tête brut.
5. Entrée masquée de l'agenda : cachée entièrement de la vue fusionnée (ni titre, ni « occupé »).
6. Tokens d'invitation : aléatoires, uniques, à durée de vie limitée (`expiresAt`), stockés en empreinte. Invitation
   à un événement : usage lié à l'e-mail invité. Lien d'invitation à un Espace : non lié à une adresse (on le partage
   par message), mais à usage unique, révocable, et réservé à une personne connectée.
7. Limitation de débit sur connexion, inscription, invitation et réinitialisation.

## Tests

Matrice par procédure : anonyme, membre d'un autre Espace, rôle insuffisant, autorisé. Un test énumère les procédures et
échoue si l'une n'a pas de garde.
