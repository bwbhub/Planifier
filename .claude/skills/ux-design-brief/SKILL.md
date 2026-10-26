---
name: ux-design-brief
description: Direction « Doux et vivant » de Planifier (principes produit, ton, densité, écrans de la maquette Phase 1, modules et teintes). À lire avant de concevoir ou réadapter un écran, un texte d'interface ou un parcours.
---

# Design brief : Planifier

Sources : maquettes `docs/maquettes/Planifier v2 — Phase 1-light.html` et `…-dark.html` (2026-10-20, de référence :
Aujourd'hui, Todo, Création de tâche, Agenda jour/semaine, **Journal** ; clair et nuit ; mobile et PC).
`phase-1.html` est l'ancienne version, sans le Journal. Fichiers empaquetés : ouvrir dans un navigateur.

## Principes produit (non négociables)

- L'outil **aide à planifier**, point : pas de rotation, d'équilibrage, de score ni de jugement.
- Rien ne se coche, ne s'ajoute, ne s'envoie ni ne se rappelle **à l'insu** de l'utilisateur. Un rappel est proposé et
  choisi explicitement.
- Une tâche en retard se montre **sans accusation**, avec une proposition de report (« Quelques tâches à reprendre »).
- Modules à la carte : personne n'est obligé de tout utiliser ; l'écran Aujourd'hui n'affiche que les modules actifs.
- Hors Espace = privé.

## Ton

**Tutoiement** (décision de l'utilisateur, 2026-10-20) : proche et chaleureux, jamais familier (pas d'argot, pas
d'emoji, pas de « coucou »). Français simple, chaleureux, sans jargon ; un terme
technique s'explique en une phrase au point d'usage. Pas de culpabilisation, pas de ton impératif sur les retards.

## Direction visuelle

- Cartes arrondies (20 px), contrôles 12 px, pastilles pleines (999 px), beaucoup d'air, un **accent** fort
  (rose en clair `#D11F72`, orange en nuit `#FF8F5A`).
- Teintes de liste/agenda : général (bleu), boulot (orange), couple (rose), vacances (vert). Tokens dans `packages/tokens`.
- Titres : Bricolage Grotesque ; texte : DM Sans.
- Densité : aérée, un objectif par écran, mobile d'abord pour la saisie, PC pour la vue d'ensemble.
- Contrôles (relevés dans la maquette) : action principale en pastille pleine, 50 px de haut, 15 px gras ; action
  secondaire en pastille neutre. Champ : 48 px, fond `field`, bordure 2 px transparente, `accent` au focus (fond
  `surface`). Libellé 14 px gras ; « (obligatoire) » / « (facultative) » en `muted` quand le formulaire mélange les deux.
- Erreur : texte `ink` ou `accent-text` avec icône, phrase rassurante (« rien n'est perdu ») et action (« Réessayer
  maintenant ») ; pas de rouge distinct. Confirmation destructive : feuille du bas sur voile sombre, action nommée
  (« Supprimer définitivement ») et sortie douce (« Garder la page »).

## Écrans de la Phase 1

| Écran          | Contenu clé                                                                                                                                                                                     |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aujourd'hui    | « Au fil de la journée » (créneaux, « Peut-être » en pointillé), « Sans horaire » (tâches du jour), « Quelques tâches à reprendre » + report, rappel du jour                                    |
| Todo           | onglets par liste, en-tête teinté (nom, type, dates, membres), option « Atténuer les tâches qui ne me sont pas assignées », tâche avec assigné, compteur de sous-tâches, « Cochée par … »       |
| Nouvelle tâche | titre obligatoire, description, « Paramètres avancés », date, heure ou sans heure, récurrence, liste, assignation, rappel **proposé** si récurrente                                             |
| Agenda         | précédent / aujourd'hui / suivant, Jour-Semaine-Mois, « Nouvelle entrée », filtres d'agendas par personne, grille horaire avec chevauchements                                                   |
| Journal        | liste par mois (recherche, filtres par tag), lecture, écriture (brouillon enregistré, tags), gabarits, réglages (code, rappel d'écriture désactivé par défaut, export Markdown, tout supprimer) |
| États Journal  | vide, chargement, brouillon retrouvé (hors-ligne), erreur d'enregistrement, conflit entre deux appareils, verrouillé, code non reconnu, confirmations de suppression                            |

Navigation PC (barre latérale) : Aujourd'hui, Todo, Agenda, Événements, Journal, Notifications, Profil.
Navigation mobile : barre flottante en bas (fond `nav`), cinq entrées : Aujourd'hui, Todo, Agenda, Événements, Journal.
Profil et Notifications sur mobile : pas maquettés (l'initiale ronde en haut d'Aujourd'hui en est le candidat).
Aujourd'hui avec le Journal actif : bouton « Écrire une page ».

## À maquetter (Phase 2)

Événements (liste, création, détail), Espaces (création, invitation, modules), Notifications, Profil, connexion et
inscription, Agenda mois, états vides et d'erreur hors Journal.

## Fiche d'écran (avant tout code d'UI)

Objectif de l'écran · utilisateur · données affichées (chacune sert une décision) · actions · états (vide, chargement,
erreur, hors-ligne) · clair/nuit · mobile/PC.
