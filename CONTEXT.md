# Planifier v2 — Glossaire du domaine (CONTEXT.md)

Vocabulaire du produit, sans détail d'implémentation. À copier à la racine du repo. Source fonctionnelle : `contexte-projet.md`.

## Personnes

- **Utilisateur** : personne avec un compte. Active les modules qu'il veut.
- **Invité sans compte** : personne invitée à un événement par e-mail ou lien, qui a choisi de ne pas s'inscrire. Ne reçoit jamais de notification.
- **Contact** _(futur)_ : personne enregistrée dans « mes contacts », avec possibilité de favoris, pour faciliter la création d'événements (groupes d'amis). Reprend et étend la notion d'amitié existante.

## Espaces et modules

- **Espace** (Space) : ensemble de personnes qui partagent des choses. Un couple, une colocation ou des vacances sont chacun un espace. Une seule notion pour tous. Tous les membres sont égaux par défaut ; des droits plus fins sont possibles mais optionnels.
- **Propriétaire d'espace** : dans un espace à 2 personnes, les deux le sont par défaut. À plus de 2, le créateur l'est, et peut en nommer d'autres. Le rôle est fixé à l'arrivée : un espace retombé à 2 avec un seul propriétaire le reste, et l'app propose à ce propriétaire de nommer l'autre, sans rien changer d'elle-même.
- **Créateur d'espace** : propriétaire protégé tant qu'il est membre ; personne ne le rétrograde ni ne le retire. S'il part, la protection s'arrête.
- **Module** : fonction activable à la carte (Todo, Agenda, Événements, Journal). Personne n'est obligé de tous les utiliser.
- **Espace personnel** : ce qui n'est rattaché à aucun espace est privé.
- **Lien d'invitation d'espace** : lien créé par un propriétaire, à usage unique, valable 7 jours. Rien n'est envoyé : le propriétaire le partage lui-même ; la personne connectée qui l'ouvre voit l'espace, puis le rejoint.
- **Gestion d'un espace** : nom, modules, visibilité, invitations, rôles, retrait de membres et suppression reviennent aux propriétaires ; un membre peut quitter. Le dernier propriétaire ne part pas tant qu'il reste des membres (il nomme un autre propriétaire ou supprime l'espace) ; le dernier membre qui part supprime l'espace.
- **Visibilité dans un espace** : par défaut, un membre voit tous les éléments de l'espace. Elle se restreint dans les paramètres de l'espace.
- **Espace supprimé** : ses événements deviennent personnels pour leur propriétaire ; les participants gardent leur accès.

## Todo

- **Liste** : ensemble de tâches. Plusieurs par utilisateur.
- **Liste perso** : privée. Peut être partagée en lecture seule.
- **Liste partagée** : liste rattachée à un Espace où Todo est activé. Tous ses membres la voient, y ajoutent et cochent des tâches, même si l'Espace restreint sa visibilité. Elle appartient à l'Espace : son créateur la rattache à un Espace ou la rend perso tant qu'il en est membre ; parti, il ne la voit plus et elle reste à l'Espace. Son créateur ou un propriétaire de l'Espace la supprime. Todo désactivé dans l'Espace : rien n'est supprimé. Créée dans un Espace, elle prend par défaut le nom « Liste <Espace> », modifiable. Espace supprimé : elle redevient perso pour son créateur.
- **Cochée par** : sur une liste partagée, une tâche cochée dit qui l'a cochée.
- **Liste d'événement** : liste commune unique d'un événement, avec assignation possible.
- **Tâche** : titre obligatoire ; description, échéance, récurrence, sous-tâches optionnels.
- **Sous-tâche** : tâche rattachée à une tâche de la même liste, sur un seul niveau. Cochée seule : rien ne se coche en cascade, dans un sens ni dans l'autre. Supprimée avec sa tâche. Compte dans la limite de tâches de la liste, pas dans le nombre de tâches à faire affiché pour la liste.
- **Récurrence** : indépendante de la date et de l'heure.
- **Assignation** : désigne qui s'en occupe, jamais imposée.
- **Clone lié** : copie d'une tâche dans une autre liste. Cocher le clone coche l'original, pas l'inverse.
- **Tâche orpheline** : clone dont l'original a été supprimé. Signalée jusqu'à décision de l'utilisateur (supprimer ou garder comme indépendante).
- **Rappel** : option d'une tâche, choisie explicitement.
- **Relance** : rappel doux répété. Entièrement paramétrable par l'utilisateur.
- **Tâche en retard** : montrée sans accusation, avec proposition de report.

## Agenda

- **Agenda** : agenda d'un utilisateur, destiné à remplacer son agenda existant.
- **Entrée** (ou créneau) : élément de l'agenda.
- **Entrée masquée** : cachée entièrement de la vue fusionnée (ni titre, ni « occupé »).
- **Vue fusionnée** : agendas de plusieurs membres d'un espace, tout visible par défaut.
- **Vue Aujourd'hui** : timeline du jour et tâches du jour, selon les modules actifs.
- **Créneau lié à une tâche** : lien à sens unique. Aucune coche automatique de la tâche.
- **Flux iCal d'import** : lien privé d'un agenda externe lu par l'app.
- **Flux iCal d'export** : abonnement personnel pour voir nos entrées dans un autre agenda.
- **Source / UID** : origine d'une entrée importée et son identifiant d'origine, pour éviter les doublons.

## Événements

- **Événement** : rendez-vous social (anniversaire, week-end), de base léger : lieu, date, infos, invités.
- **Brique** : fonction ajoutée à un événement (agenda, todo, budget).
- **Propriétaire d'événement** : active et désactive les briques.
- **Co-organisateur** : active des briques, assigne, valide les propositions.
- **Propriétaire parti** : le propriétaire a supprimé son compte. Un co-organisateur peut reprendre la propriété, sans obligation ; sans repreneur sous 48 h, l'événement est supprimé.
- **Invité** : voit l'événement et réagit.
- **Invitation** : lien lié à une adresse e-mail, rattaché au compte s'il existe.
- **Proposition d'invité** : un invité propose quelqu'un, un organisateur valide.
- **Réponse** : j'y vais / peut-être / je n'y vais pas / en attente. Seule « j'y vais » et « peut-être » placent l'événement dans l'agenda.
- **Commentaire important** : commentaire qui notifie les inscrits.
- **Champ important** : lieu, date, heure. Sa modification notifie.
- **Budget d'événement** : partage de frais type Tricount, en parts égales, uniquement des soldes.
- **Participant au budget** : peut être sans compte (un prénom).
- **Solde** : ce que chacun doit ou doit recevoir. L'app ne touche jamais d'argent.

## Notifications

- **Notification** : message dans l'onglet des notifications, éventuellement poussé.
- **Canal** : push, e-mail, les deux ou aucun, au choix de l'utilisateur. Push par défaut.
- **Notification de présence** : signale sans pression des éléments récurrents du jour. Désactivable.

## Principe

L'outil aide la planification, point. Pas de rotation, d'équilibrage, de score ni de jugement. Rien ne se coche ni ne s'ajoute à l'insu de l'utilisateur.

## Journal

D'après la maquette du 2026-10-20 ; règles fines à confirmer.

- **Journal** : pages strictement personnelles, jamais partagées ni visibles dans un espace.
- **Page** : date, titre, texte, tags. Supprimée définitivement, sans corbeille.
- **Gabarit** : modèle de page fait de sections (chacune devient un titre). Gabarits proposés ou créés par l'utilisateur ; « Page libre » sans gabarit.
- **Tag** : étiquette libre d'une page, pour filtrer.
- **Verrou** : code à 6 chiffres demandé à l'ouverture du Journal, optionnel, proposé à la première ouverture.
- **Rappel d'écriture** : proposition d'écrire à une heure choisie, désactivée par défaut ; le message ne contient jamais le contenu d'une page.
- **Brouillon** : texte gardé sur l'appareil tant qu'il n'est pas enregistré.
- **Conflit** : page modifiée sur deux appareils ; la version la plus récente est gardée, l'autre reste récupérable une semaine.
