---
name: testing-standards
description: Stratégie de tests (pyramide, logique pure, base réelle, droits, composants et accessibilité, parcours E2E, correction de bug, couverture ciblée). À lire pour écrire des tests, décider quoi tester ou corriger un bug.
---

# Standards de tests

Principe : **couvrir les risques, pas les lignes.** Ce qui peut coûter cher (droits, données, calculs, doublons) est toujours testé.

## Exigences

| Quoi                                                                                  | Comment                                                                               | Obligatoire       |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------- |
| Logique pure `domain-*` : droits, récurrence, clones de tâches, soldes, doublons iCal | Vitest : cas d'or + tests par propriétés                                              | oui, seuil élevé  |
| Services d'API touchant la base                                                       | intégration sur un **vrai PostgreSQL** (conteneur), isolation par transaction annulée | oui               |
| Parcours HTTP de bout en bout (auth)                                                  | vrai PostgreSQL ; base vidée avant chaque fichier de test (`TRUNCATE`)                | oui               |
| Droits                                                                                | matrice par procédure : anonyme / autre utilisateur / rôle insuffisant / autorisé     | oui, bloquant     |
| Contrats d'API                                                                        | snapshot de la spec + détection de rupture                                            | oui               |
| Composants de `ui`                                                                    | test d'interaction + vérification d'accessibilité                                     | oui               |
| Parcours critiques                                                                    | Playwright : inscription, création d'événement, invitation, cocher une tâche          | smoke à chaque PR |
| Bug corrigé                                                                           | test de non-régression écrit **d'abord** (rouge puis vert)                            | oui               |

## Règles

- Une règle métier non triviale vit dans son package `domain-*`, testée là ; jamais réimplémentée côté UI.
- Ne pas simuler la base pour tester droits, transactions ou requêtes. Simuler seulement les frontières réseau
  (e-mail, push, flux iCal distants).
- Tests courts : un comportement par test, nommage « fait X quand Y », fabriques de données partagées.
- Pas de snapshot de gros DOM ; horloge et hasard injectés (récurrences, rappels : toujours une date fixée).
- Test instable : ticket et quarantaine sous 48 h ; jamais de `retry` généralisé.
- `*.test.ts` à côté du code ; E2E dans un dossier dédié.

## Seuils (à ajuster dans `project-context`)

`domain-*` ≥ 90 % · services d'API ≥ 80 % · `ui` ≥ 70 % · lignes modifiées de la PR ≥ 80 %.

## Avant de pousser

`pnpm check-types && pnpm lint && pnpm test` (Turborepo filtre sur les packages affectés).
