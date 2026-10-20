# 0004 — Better Auth

Statut : accepté · Date : 2026-10-15

Décision : Better Auth, cookies httpOnly, plus de JWT en localStorage, plus de secret par défaut codé en dur. Plugin d'organisations évalué pour l'Espace. Google OAuth ajouté plus tard via la même bibliothèque.
Conséquences : bibliothèque encore jeune, à surveiller.

Amendement (2026-10-20, décision de l'utilisateur) : aucune reprise des comptes de l'ancienne app (hash bcrypt
compris). Produit neuf : les utilisateurs s'inscrivent à nouveau. Montage : ADR 0016.
