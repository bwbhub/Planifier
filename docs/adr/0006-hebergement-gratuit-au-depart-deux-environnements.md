# 0006 — Hébergement gratuit au départ, deux environnements

Statut : accepté · Date : 2026-10-15

Décision : une image Docker par app, configuration par variables d'environnement. Preprod (branche Neon + services gratuits) et prod. Promotion de la même image vers la prod. Preprod : e-mails vers un bac à sable. Clés VAPID et secrets distincts par environnement.
Conséquences : veille des services gratuits (réveil d'environ 1 min), acceptable sans utilisateurs. Migration vers VPS ou plan payant : demi-journée.
