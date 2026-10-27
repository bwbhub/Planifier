# 0010 — Web Push en VAPID, e-mail derrière une interface

Statut : accepté · Date : 2026-10-15

Décision : bibliothèque `web-push`, sans service tiers. E-mail via Resend + React Email, derrière une interface `sendMail`, avec SMTP local pour le dev. PWA sans hors-ligne au départ (installation et push seulement).
Conséquences : portable ; iOS exige l'installation sur l'écran d'accueil (iOS 16.4+) ; domaine à acheter pour la vérification Resend.

Précision du 2026-10-26 (package `mails`, décision de l'utilisateur) : le « SMTP local » est Mailpit, alimenté par
son API HTTP ; Resend est appelé par `fetch` (ni SDK ni nodemailer) ; les gabarits utilisent les composants React
Email seuls, rendus par `react-dom/server` (sans `@react-email/render`, qui embarque prettier). Voir
`docs/DEPENDANCES.md`.
