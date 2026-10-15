# 0011 — Import iCal par upsert sur (source, uid)

Statut : accepté · Date : 2026-10-15

Décision : toute entrée importée garde sa source et son UID ; la réimportation est un upsert, jamais une suppression-recréation. Règle anti-boucle : nos exports sont marqués et ignorés à la relecture.
Conséquences : pas de doublons, changements détectables.
