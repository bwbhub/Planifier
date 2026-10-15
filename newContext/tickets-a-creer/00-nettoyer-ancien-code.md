# Nettoyer l'ancien code (back/, front/, stitch, guides)

- **Liste ClickUp** : 00 · Socle & infra (id 901223367129)
- **Priorité** : basse

À faire module par module, après migration : retirer `back/`, `front/`, `stitch_mobile_login/` et les guides `*_GUIDE.md` / `PROFILE_QUICK_START.md`.

Aucun retrait avant que l'équivalent soit migré. Adapter la doc (la branche s'appelle `master`, pas `main`).

## Critères
- Chaque retrait est fait dans un commit dédié, après validation du module équivalent.
- Plus aucune référence à MUI ni à Express dans le dépôt à la fin.
