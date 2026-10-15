# 0003 — API en oRPC + contrats Zod

Statut : accepté · Date : 2026-10-15

Décision : séparation `contracts` / implémentation `api`, typage de bout en bout, TanStack Query côté web via l'intégration oRPC. Express abandonné.
Conséquences : back réécrit ; une seule source de vérité pour les types. Moins de documentation publique qu'un REST classique : à garder à l'œil si une API publique devient nécessaire.
