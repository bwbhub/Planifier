---
name: frontend-data-state
description: Données et état côté front (TanStack Query avec oRPC, invalidation centralisée, stores Zustand sûrs en SSR, état dans l'URL, formulaires, rendu optimiste avec concurrence). À lire pour écrire des hooks de données, des stores ou des formulaires.
---

# Données et état côté front

## Où vit cet état ?

| Nature                                                           | Outil                                                                     |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Donnée serveur                                                   | TanStack Query (utilitaires oRPC)                                         |
| État partageable par lien (filtres, vue jour/semaine/mois, date) | paramètres d'URL                                                          |
| Formulaire                                                       | un seul formulaire création/modification, résolveur Zod dérivé du contrat |
| État d'interface transverse (dialogue, sélection)                | store                                                                     |
| État local                                                       | `useState` / `useReducer`                                                 |
| Valeur dérivée                                                   | calculée, jamais stockée                                                  |

La donnée serveur n'est **jamais** copiée dans un store. (Outils de store, d'URL et de formulaire : fiche de dépendance requise.)

## TanStack Query

- Hooks définis dans `queries/` du module ; ni `fetch` manuel ni appel d'API dans un composant.
- **Invalidation centralisée** par préfixe de clé ; aucun `invalidateQueries` ad hoc dans les composants.
- `QueryClient` **par requête** côté serveur ; préchargement + hydratation.
- Erreurs globales : `UNAUTHORIZED` → reconnexion, `CONFLICT` → proposer de recharger, `TOO_MANY_REQUESTS` → message.
- États obligatoires : chargement (squelette), vide, erreur avec reprise.

## Stores

Un store par préoccupation, avec sélecteurs. En SSR, créer le store **par requête** s'il est lu pendant un rendu serveur.
Réinitialiser à la déconnexion. Pas de `persist` de données sensibles.

## Rendu optimiste et concurrence

Annuler les requêtes en cours → capturer l'état → appliquer localement → **restaurer en cas d'erreur** → invalider.
Envoyer `version` ; sur `CONFLICT`, informer et proposer de recharger. Cocher une tâche : retour immédiat, jamais de
coche automatique à l'insu de l'utilisateur.

## Fraîcheur multi-utilisateur

Liste partagée = plusieurs personnes qui cochent : `refetchOnWindowFocus`, invalidation après mutation. SSE/WebSocket
seulement si les conflits deviennent fréquents (décision documentée).

## Sécurité

Aucun secret côté client ; l'état client n'est pas une autorité (le serveur revalide) ; pas de `dangerouslySetInnerHTML`.
