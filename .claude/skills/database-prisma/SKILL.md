---
name: database-prisma
description: Conventions Prisma 7 / PostgreSQL pour Planifier (schéma, enums vs strings, JSON typé, droits par Espace, migrations sans interruption, seed, performances). À lire en modifiant schema.prisma, une migration, un seed ou une requête. Conventions visées : le package db n'existe pas encore.
---

# Base de données (Prisma 7 + PostgreSQL / Neon)

**Version épinglée : Prisma 7.x.** Pas de 8 tant qu'elle est en RC (ADR 0005). Aucune fonction propre à l'hébergeur.

## Schéma

- Tables et colonnes en `snake_case` via `@map`/`@@map`, modèles en PascalCase. Identifiants non séquentiels (UUID/CUID).
- Colonnes standard : `createdAt`, `updatedAt` ; `version Int @default(1)` sur les entités éditables (concurrence optimiste).
- Rattachement : `spaceId` **nullable** et indexé sur les ressources partageables (liste, agenda, événement) ; `null` =
  personnel et privé (ADR 0009). L'auteur/propriétaire (`ownerId`) est non nul, sauf exception
  documentée dans le schéma (`Event.ownerId` : propriétaire parti, reprise ou suppression sous 48 h).
- Suppression : décider par entité (réelle, `deletedAt`, archivage). Tâche supprimée avec des clones liés ⇒ les clones
  deviennent **orphelins** (`CONTEXT.md`), jamais supprimés en cascade.
- Relations toujours réciproques ; `prisma validate` et `prisma format` à chaque PR.

## Enum, string ou JSON ?

| Cas                                                              | Choix                                                                         |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Ensemble fermé et stable (rôle d'événement, statut de réponse)   | enum Prisma, miroir dans `@planifier/constants`                               |
| Ensemble évolutif                                                | `String` + liste dans `constants` + validation Zod en écriture **et** lecture |
| Donnée documentaire évolutive (règle de récurrence, préférences) | `Json` + schéma Zod versionné (`schemaVersion`) ; pas de filtre chaud dessus  |

## Règles métier : où ?

Zod valide la **forme**. Une règle qui dépend de l'état en base (transition de statut, quota, unicité métier) vit dans un
**service** en **transaction**, jamais dans un schéma Zod (course « vérifier puis écrire »).

## Migrations

1. Local : prototypage autorisé, rien de commité avant la fin.
2. Avant revue : rebase, base locale neuve, **une seule** migration nommée, SQL relu, commitée **dans la PR**.
3. CI : appliquer toutes les migrations sur une base vide, prouver l'absence de dérive, puis seed.
4. Environnements partagés : `migrate deploy` uniquement. Jamais `db push`, `migrate reset`, `--accept-data-loss`. Jamais
   au démarrage d'un service répliqué.
5. Compatibilité ancienne/nouvelle version (_expand / contract_) : ajouter nullable → déployer → backfill → `NOT NULL`
   → retirer l'ancien dans une release ultérieure. Renommer = ajouter + copier + basculer + supprimer.
6. Migration destructive : label dédié, sauvegarde vérifiée, validation humaine.

## Seed

Obligatoire pour toute fonctionnalité, **idempotent**, déterministe, un module par domaine. Refuse de tourner si
`NODE_ENV=production`. Comptes de démo : local uniquement.

## Requêtes

Un client Prisma par processus (singleton), import réservé à `db`/`api`. `select` explicite en sortie, pas d'`include`
profond, pagination par curseur, `$transaction` pour toute écriture multiple. SQL brut : paramétré uniquement.
Neon : connexions poolées (à vérifier avec Prisma 7). Montants en entiers.

## Migration de l'existant

Le schéma actuel (`back/prisma/schema.prisma`) est la base : User, Event, EventParticipant, EventSettings, Invite,
ProposedInvite, Notification, Comment, Friendship. Comptes : hash bcrypt à migrer vers Better Auth (ADR 0004).

## Données personnelles

Annoter les champs concernés (`/// @pii <catégorie> <rétention>`). Jamais dans les journaux.
