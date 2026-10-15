# 0007 — Jobs planifiés différés, conçus comme des endpoints

Statut : accepté · Date : 2026-10-15

Décision : pas de cron au lancement. Les rappels sont des lignes avec heure et statut ; le traitement est un endpoint HTTP protégé par secret, idempotent. Déclencheur interchangeable (Cloudflare Workers cron gratuit, cron système, pg-boss).
Conséquences : aucun coût au départ ; les rappels, relances et rafraîchissements iCal arrivent avec leurs modules.
