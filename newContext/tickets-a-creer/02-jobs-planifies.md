# Jobs planifiés : endpoints idempotents protégés par secret

- **Liste ClickUp** : 07 · Qualité & mise en prod (id 901223367138)
- **Priorité** : normale
- **Réf.** : ADR 0007

Pas de cron au lancement. Le traitement des rappels, relances et rafraîchissements iCal est exposé en endpoints HTTP.

- Protégés par un secret.
- Idempotents : un second appel ne renvoie pas deux fois la même notification.
- Déclencheur interchangeable (Cloudflare Workers cron gratuit, cron système, pg-boss).

## Critères
- Les rappels sont des lignes en base avec heure et statut.
- Appeler l'endpoint deux fois de suite ne traite chaque rappel qu'une fois.
- Sans le secret, l'endpoint refuse.
