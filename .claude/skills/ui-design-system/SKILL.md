---
name: ui-design-system
description: Règles du design system et de packages/ui (primitives sans métier, tokens clair/nuit, Tailwind 4, accessibilité, texte). À lire pour créer ou modifier un composant partagé, un token, ou décider si un composant va dans ui ou dans un module.
---

# Design system et package UI

## Périmètre

- `packages/ui` : **primitives** sans donnée, sans appel réseau, sans store, sans métier ; tout arrive par props. Il ne
  dépend d'aucun contrat d'API.
- Composants liés au métier (ligne de tâche, bloc de créneau) : `features/<module>/atoms` ; partagés par 2 modules :
  `features/_shared`. Un composant utilisé 3 fois sans métier monte dans `ui` (PR dédiée, `code-structure`).
- Pas de MUI (ADR 0008). Fondations accessibles : fiche de dépendance requise avant d'en ajouter une.

## Tokens et thème

- Source : `packages/tokens` (maquette « Doux et vivant »). Variables sémantiques (`--surface`, `--ink`, `--muted`,
  `--accent`, `--field`, `--line`, teintes de liste) exposées à Tailwind (`bg-surface`, `text-muted`, `bg-tint-trip`).
- Clair et nuit : redéfinition des variables ; thème système ou `data-theme`. **Tout écran est livré dans les deux.**
- Interdit : couleur, ombre, rayon ou taille en dur dans un composant. Ajouter un token = clair **et** nuit.
- Variantes via `cva`/équivalent (fiche requise) ; API de props homogène (`className`, `variant`, `size`, `disabled`).
- Polices : Bricolage Grotesque (titres, `font-display`), DM Sans (texte).

## Accessibilité (WCAG 2.2 AA)

Navigation clavier complète, focus visible, rôles ARIA justes (préférer les éléments natifs), contraste ≥ 4,5:1,
**cibles tactiles ≥ 44 px** (norme de la maquette), `prefers-reduced-motion` respecté, labels et erreurs reliés aux
champs, aucune information portée par la seule couleur (ex. « Peut-être » = bordure pointillée **et** libellé).

## Texte

Aucun texte en dur dans `ui` : props ou catalogue. Français par défaut ; dates, nombres via `Intl`.

## Qualité

Composants client minimaux (`"use client"` seulement si nécessaire) ; `sideEffects: false` ; pas de barrel géant ;
un test d'interaction + accessibilité par composant.

## Checklist PR

- [ ] Aucun import de contrat, service ou store dans `ui`
- [ ] Tokens sémantiques uniquement ; clair et nuit vérifiés
- [ ] Clavier et lecteur d'écran vérifiés sur l'interactif
- [ ] États : normal, survol, focus, désactivé, erreur, vide, chargement
