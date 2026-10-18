---
name: ux-design-brief
description: Direction « Doux et vivant » de Planifier (principes produit, ton, densité, écrans de la maquette Phase 1, modules et teintes). À lire avant de concevoir ou réadapter un écran, un texte d'interface ou un parcours.
---

# Design brief : Planifier

Source : maquette `docs/maquettes/phase-1.html` (Aujourd'hui, Todo, Création de tâche, Agenda jour/semaine ;
clair et nuit ; mobile et PC).

## Principes produit (non négociables)

- L'outil **aide à planifier**, point : pas de rotation, d'équilibrage, de score ni de jugement.
- Rien ne se coche, ne s'ajoute, ne s'envoie ni ne se rappelle **à l'insu** de l'utilisateur. Un rappel est proposé et
  choisi explicitement.
- Une tâche en retard se montre **sans accusation**, avec une proposition de report (« Quelques tâches à reprendre »).
- Modules à la carte : personne n'est obligé de tout utiliser ; l'écran Aujourd'hui n'affiche que les modules actifs.
- Hors Espace = privé.

## Ton

Vouvoiement ou tutoiement : **à trancher** (la maquette est neutre). Français simple, chaleureux, sans jargon ; un terme
technique s'explique en une phrase au point d'usage. Pas de culpabilisation, pas de ton impératif sur les retards.

## Direction visuelle

- Cartes arrondies (20 px), contrôles 12 px, pastilles pleines (999 px), beaucoup d'air, un **accent** fort
  (rose en clair `#D11F72`, orange en nuit `#FF8F5A`).
- Teintes de liste/agenda : général (bleu), boulot (orange), couple (rose), vacances (vert). Tokens dans `packages/tokens`.
- Titres : Bricolage Grotesque ; texte : DM Sans.
- Densité : aérée, un objectif par écran, mobile d'abord pour la saisie, PC pour la vue d'ensemble.

## Écrans de la Phase 1

| Écran          | Contenu clé                                                                                                                                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Aujourd'hui    | « Au fil de la journée » (créneaux, « Peut-être » en pointillé), « Sans horaire » (tâches du jour), « Quelques tâches à reprendre » + report, rappel du jour                              |
| Todo           | onglets par liste, en-tête teinté (nom, type, dates, membres), option « Atténuer les tâches qui ne me sont pas assignées », tâche avec assigné, compteur de sous-tâches, « Cochée par … » |
| Nouvelle tâche | titre obligatoire, description, « Paramètres avancés », date, heure ou sans heure, récurrence, liste, assignation, rappel **proposé** si récurrente                                       |
| Agenda         | précédent / aujourd'hui / suivant, Jour-Semaine-Mois, « Nouvelle entrée », filtres d'agendas par personne, grille horaire avec chevauchements                                             |

Navigation PC : Aujourd'hui, Todo, Agenda, Événements, Notifications, Profil. **Navigation mobile : à maquetter.**

## À maquetter (Phase 2)

Événements (liste, création, détail), Espaces (création, invitation, modules), Notifications, Profil, barre mobile,
Agenda mois, états vides et d'erreur.

## Fiche d'écran (avant tout code d'UI)

Objectif de l'écran · utilisateur · données affichées (chacune sert une décision) · actions · états (vide, chargement,
erreur, hors-ligne) · clair/nuit · mobile/PC.
