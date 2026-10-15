---
name: feature-delivery-workflow
description: Workflow de bout en bout pour livrer une fonctionnalité ou un correctif (cadrage, réutilisation, choix de couche, ordre base → contrat → API → UI, portes, PR, définition de terminé). À lire en démarrant une tâche non triviale ou en préparant une PR.
---

# Workflow de livraison

Lire d'abord `project-context`.

## 0. Cadrer (réponses écrites dans la PR)

Critères d'acceptation ? Qui peut voir ou modifier quoi (**droits**, `auth-authorization`) ? Données personnelles ?
Sécurité (nouvelle route publique, e-mail, push, import de flux externe) ? Compatibilité de déploiement (contrat,
schéma) ? Nouvelle variable d'environnement (`runtime-configuration`) ? Fichier généré touché ?

## 1. Chercher l'existant

`rg` dans le workspace : composant, schéma, service, fonction pure. Nouvelle dépendance → `dependency-governance`.

## 2. Décider la couche, noter la conception

Arbre de `workspace-architecture`. Écrire un **ADR court** (contexte, décision, alternatives, conséquences) si la tâche
crée un package, ajoute une dépendance, change le modèle de données, ajoute une frontière de confiance ou déroge à une règle.

## 3. Implémenter dans cet ordre

1. Schéma Prisma + seed
2. Types générés, puis contrat et DTO
3. Service, routeur, chaîne d'accès
4. UI et état
5. Tests (droits, intégration, parcours critique)
6. Docs : README du package touché, ADR

## 4. Portes locales (depuis la racine)

```
pnpm check-types && pnpm lint && pnpm test
pnpm build        # si dépendances, config d'app ou version cœur touchées
```

Corriger avant de continuer. **Ne jamais annoncer « prêt » si une étape échoue ou n'a pas été exécutée.**

## 5. PR

Petite, un sujet. Description : quoi/pourquoi, captures (clair **et** nuit, mobile **et** PC), plan de test, réponses du
cadrage, risques et retour arrière. Checklist :

- [ ] Types dérivés, aucun `any`, parsing aux frontières
- [ ] Droits : chaque lecture/écriture filtrée ; test « autre utilisateur » ⇒ `NOT_FOUND`
- [ ] Chaque procédure : `.input()`, `.output()`, chaîne d'accès complète
- [ ] Nouvelle variable ⇒ `.env.example` + `env.ts`
- [ ] Migration unique, relue, compatible ancienne/nouvelle version
- [ ] Contrat additif (ou rupture déclarée)
- [ ] États vide / chargement / erreur ; accessibilité ; clair et nuit
- [ ] Rien ne se coche, ne s'ajoute ni ne s'envoie à l'insu de l'utilisateur
- [ ] Dépendances : fiche ; aucun secret ; docs à jour

## 6. S'arrêter et demander

Migration destructive ou sur environnement partagé ; changement d'auth ou de secrets ; dépendance à licence douteuse ;
règles contradictoires ; périmètre qui dépasse le package prévu ; besoin d'accès à la production.

## Définition de terminé

Portes vertes, revue (humaine si déclencheur de sécurité), vérifié en preprod, docs à jour, ticket ClickUp clos avec
lien vers la PR.
