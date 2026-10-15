# Import iCal : upsert sur (source, uid) + anti-boucle

- **Liste ClickUp** : 06 · Agenda & Aujourd'hui (id 901223367137)
- **Priorité** : normale
- **Réf.** : ADR 0011

Flux iCal privé lu par l'app.

- Toute entrée importée garde sa source et son UID.
- Réimportation = upsert, jamais suppression-recréation.
- Nos exports sont marqués et ignorés à la relecture (anti-boucle).
- Détection des doublons en fonction pure, testée avec Vitest.

## Critères
- Importer deux fois le même flux ne crée aucun doublon.
- Une entrée modifiée à la source est mise à jour, pas recréée.
- Un export Planifier relu par l'import est ignoré.
