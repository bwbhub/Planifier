# 0010 — Web Push en VAPID, e-mail derrière une interface

Statut : accepté · Date : 2026-10-15

Décision : bibliothèque `web-push`, sans service tiers. E-mail via Resend + React Email, derrière une interface `sendMail`, avec SMTP local pour le dev. PWA sans hors-ligne au départ (installation et push seulement).
Conséquences : portable ; iOS exige l'installation sur l'écran d'accueil (iOS 16.4+) ; domaine à acheter pour la vérification Resend.
