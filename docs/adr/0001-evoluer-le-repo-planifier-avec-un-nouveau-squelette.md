# 0001 — Évoluer le repo Planifier avec un nouveau squelette

Statut : accepté · Date : 2026-10-15

Contexte : un existant avec schéma événements/invitations/rôles utile, mais JS, auth maison, MUI, Express.
Décision : on garde le dépôt, on y crée un nouveau squelette monorepo TS, on migre le schéma puis les écrans module par module. Ce qui peut être gardé reste, le reste est supprimé. `main` n'est pas cassé pendant la migration.
Conséquences : historique conservé, mais réécriture réelle du back et du front.
