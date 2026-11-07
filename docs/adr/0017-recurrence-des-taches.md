# 0017 — Récurrence des tâches : l'échéance avance à la coche

Statut : proposé (en attente : choix des tâches planifiées du projet, cron) · Date : 2026-10-28

Contexte : une tâche peut se répéter (`CONTEXT.md` : « Récurrence : indépendante de la date et de l'heure »). Il faut
décider ce que fait « cocher » sur une tâche répétée, sans rien cocher ni ajouter à l'insu de l'utilisateur, et sans
job planifié (ADR 0007 pas encore en place).

Décision :

- Une seule ligne par tâche répétée. La cocher valide l'occurrence : la tâche reste à faire et son échéance passe à la
  **première occurrence strictement après aujourd'hui et après l'échéance actuelle**, comptée depuis l'**ancre** de la
  série (voir Stockage). Une tâche cochée en retard saute les occurrences passées. Aucune tâche n'est créée.
- Rythmes : tous les N jours, semaines, mois ou ans (N de 1 à 99). Rythme hebdomadaire : jours de la semaine facultatifs
  (voir Jours de la semaine). Un jour absent du mois d'arrivée (31, 29 février)
  devient le dernier jour du mois, sans glissement pour les suivantes : toutes les occurrences se calculent depuis
  l'ancre, jamais depuis l'échéance précédente (« le 31 » donne 28 février puis 31 mars).
- Procédure dédiée `todo.tasks.completeOccurrence` (`version` + `today`, jour de l'appareil : le serveur ne connaît pas
  le fuseau). Rejouer la même coche ⇒ `CONFLICT STALE_VERSION`, jamais deux avances. Arrêter la répétition
  seule : retirer la règle (`update`, `recurrence: null`).
- Terminer pour de bon (choix de l'utilisateur, 2026-10-29) : `todo.tasks.finish` arrête la répétition et coche la
  tâche en une écriture ; elle passe, grisée, dans « Cochées ».
- Garde-fou (choix de l'utilisateur) : une occurrence faite ou un « Terminer » s'annule depuis l'annonce
  (`todo.tasks.undoCompletion` : échéance et règle d'avant, tâche à faire, ancre gardée, sur la version rendue par la
  coche).
- Sous-tâches d'une tâche répétée : elles gardent leur état d'une occurrence à l'autre (choix de l'utilisateur).
- `today` vient de l'appareil, sans borne côté serveur : un appareil mal réglé est un problème du client (choix de
  l'utilisateur).
- Aucune tâche planifiée (cron) : tout se calcule au geste de l'utilisateur.
- Stockage : colonne `tasks.recurrence` JSON versionnée (`schemaVersion: 1`), validée en écriture et en lecture par
  `@planifier/domain-recurrence/stored` ; calcul pur `nextDueDate` dans `@planifier/domain-recurrence`.
- Ancre : colonne `tasks.recurrence_anchor` (jour), posée à la première occurrence faite (échéance d'alors, sinon
  aujourd'hui) et remise à vide quand l'utilisateur change l'échéance ou la règle : la série repart de là. Interne,
  absente du contrat ; le rendu optimiste du web compte depuis l'échéance, la réponse du serveur fait foi.

Alternatives écartées :

- Créer une nouvelle tâche à chaque coche : historique gratuit, mais des tâches apparaissent sans geste direct et les
  listes grossissent.
- Tâche « cochée jusqu'à la prochaine période » : demande le fuseau de l'utilisateur côté serveur pour les compteurs,
  et décoche d'office.
- Deux colonnes (rythme, intervalle) : plus simple aujourd'hui, mais la règle évoluera (jours de semaine, « le premier
  lundi ») ; la skill `database-prisma` prévoit un JSON versionné pour ce cas.

Conséquences : pas d'historique des occurrences faites ; le rappel proposé pour une tâche récurrente (maquette)
attend les notifications ; sous-tâches répétables comme les autres.

Mise à jour 2026-11-07 — jours de la semaine (choix de l'utilisateur : « tous les mardis » sans heure est valide) :

- Une règle hebdomadaire peut porter des **jours de la semaine** (`weekdays`, 1 à 7, sans doublon, rangés lundi en
  premier ; refusés avec un autre rythme). « Tous les mardis » = `WEEKLY`, 1, `[TUESDAY]` ; « un lundi sur deux » =
  `WEEKLY`, 2, `[MONDAY]`. La règle est indépendante de l'échéance : elle n'a pas besoin d'en avoir une.
- Prochaine occurrence : premier jour voulu **strictement après aujourd'hui et après l'échéance**, dans une semaine
  qui tombe sur le rythme, les semaines se comptant du lundi au dimanche depuis la semaine de l'**ancre**.
- Ancre d'une règle à jours **sans échéance ni ancre** : la première occurrence après aujourd'hui (et non le jour de la
  coche), pour que la parité des semaines (« un lundi sur deux ») compte depuis le premier lundi voulu.
- Stockage : `schemaVersion: 2` ajoute `weekdays` ; la version 1 reste lisible, on écrit toujours la 2. Contrat d'API
  additif (`weekdays` facultatif, règle 10) : une règle sans jours se comporte comme avant.
- Une tâche répétée à jours sans échéance n'a pas de date tant qu'on ne l'a pas cochée ; savoir si elle tombe un jour
  donné (écran Aujourd'hui) se calcule avec la règle, sans date stockée.
