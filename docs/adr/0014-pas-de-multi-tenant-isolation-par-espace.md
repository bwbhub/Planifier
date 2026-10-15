# 0014 — Pas de multi-tenant : l'isolation se fait par propriété et par Espace

Statut : accepté · Date : 2026-10-15

Contexte : le dépôt de référence est multi-tenant ; Planifier ne l'est pas. L'équivalent du « tenant » est la
**propriété d'une ressource** (utilisateur) et son **rattachement à un Espace** (ADR 0009).

Décision : toute lecture ou écriture de ressource (liste, tâche, entrée d'agenda, événement) est filtrée par les
droits de l'appelant (propriétaire, membre d'Espace, rôle d'événement, partage par ressource). Une ressource à
laquelle l'appelant n'a aucun droit répond `NOT_FOUND` (jamais `FORBIDDEN`, qui révélerait son existence). Les
fonctions de droits sont **pures**, dans un package dédié, testées par Vitest.

Conséquences : pas de `tenantId` partout ; les droits sont calculés à partir de (utilisateur, Espace, partage).
Un test énumère les procédures d'API et vérifie qu'aucune ne contourne la chaîne d'accès.
