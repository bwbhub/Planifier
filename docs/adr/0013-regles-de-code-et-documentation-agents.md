# 0013 — Règles de code outillées et documentation pour agents

Statut : accepté · Date : 2026-10-15

Contexte : développement assisté par des agents IA ; besoin de règles non ambiguës, vérifiables, et d'une
documentation que les agents lisent avant d'agir.

Décision : `AGENTS.md` (règles non négociables) + `.claude/skills/*` (une compétence par sujet, chargée à la demande) +
`project-context` (cartographie, commandes, dérogations). Les règles qui peuvent être vérifiées par un outil le sont
(ESLint, `tsc`, CI) ; une règle non outillée est une recommandation. Inspiration : l'organisation des règles du
dépôt de référence (conventions seulement, contenu réécrit pour Planifier ; NDA respecté, ADR 0002).

Conséquences : toute nouvelle dépendance passe par une fiche de décision (`docs/DEPENDANCES.md`) ; toute dérogation
est tracée dans `project-context` ; les portes locales (`check-types`, `lint`, `test`, `build`) doivent être
réellement exécutées avant de déclarer un travail terminé.
