# 0014 — Pas de multi-tenant : l'isolation se fait par propriété et par Espace

Statut : accepté · Date : 2026-10-15

Contexte : le dépôt de référence est multi-tenant ; Planifier ne l'est pas. L'équivalent du « tenant » est la
**propriété d'une ressource** (utilisateur) et son **rattachement à un Espace** (ADR 0009).

Décision : toute lecture ou écriture de ressource (liste, tâche, entrée d'agenda, événement) est filtrée par les
droits de l'appelant (propriétaire, membre d'Espace, rôle d'événement, partage par ressource). Une ressource à
laquelle l'appelant n'a aucun droit répond `NOT_FOUND` (jamais `FORBIDDEN`, qui révélerait son existence). Les
fonctions de droits sont **pures**, dans un package dédié, testées par Vitest.

Précision (2026-10-27) : `NOT_FOUND` vaut pour une ressource que l'appelant ne peut pas lire. S'il la voit déjà
(membre d'un Espace qui n'en est pas propriétaire), une action refusée répond `FORBIDDEN` : son existence n'est pas
un secret pour lui, et l'interface peut dire pourquoi.

Conséquences : pas de `tenantId` partout ; les droits sont calculés à partir de (utilisateur, Espace, partage).
Un test énumère les procédures d'API et vérifie qu'aucune ne contourne la chaîne d'accès.
