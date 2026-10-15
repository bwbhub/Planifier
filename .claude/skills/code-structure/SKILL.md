---
name: code-structure
description: DRY et KISS appliqués de façon mesurable (règle des trois, seuils de taille et de complexité, une finalité par fichier, gestion d'erreurs, commentaires). À lire en écrivant ou refactorant du code, avant d'extraire un composant, ou en relisant une PR.
---

# Structure du code : DRY et KISS

## DRY sans abstraction prématurée

1. **Chercher d'abord** (`rg`) : une logique équivalente existe-t-elle ? La réutiliser.
2. **Règle des trois** : 1re occurrence on écrit, 2e on tolère, 3e on extrait. Exception : logique de droits ou de calcul
   (récurrence, soldes) → centralisée dès la 2e.
3. Factory quand un motif se répète vraiment (ex. dialogues création/modification) plutôt que N copies.

## KISS : limites vérifiées par le lint

- Fichier ≤ 500 lignes (viser 300). Fonction ≤ 80 lignes (viser 50). Complexité ≤ 10. Paramètres ≤ 4 (sinon un objet).
- Une finalité par fichier, reflétée par le suffixe (`.schemas.ts`, `.contract.ts`, `.service.ts`, `.queries.ts`,
  `.store.ts`, `.test.ts`).
- Props drilling : 2 niveaux acceptables ; au-delà, composition (`children`, slots) ou store.
- Pas d'export par défaut (hors pages Next), pas de nombres magiques (constantes nommées).

## Gestion d'erreurs

Erreurs typées ; jamais de `catch {}` vide ; `catch (e: unknown)` puis réduction de type ; pas d'exception pour le flux
normal ; message utilisateur séparé du message technique. Ton des messages : voir `ux-design-brief`.

## Commentaires

Commenter le **pourquoi** (contrainte, décision, ADR), pas le quoi. Préférer un nom précis. Fonctions pures et
dépendances injectées pour tester sans mocks lourds.

## Refactoring

Commits séparés pour refactoring et changement de comportement. Règle du boy-scout dans la zone touchée, sans élargir le périmètre.
