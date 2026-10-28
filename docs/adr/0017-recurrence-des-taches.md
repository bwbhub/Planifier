# 0017 — Récurrence des tâches : l'échéance avance à la coche

Statut : proposé (règles posées par l'agent, à valider) · Date : 2026-10-28

Contexte : une tâche peut se répéter (`CONTEXT.md` : « Récurrence : indépendante de la date et de l'heure »). Il faut
décider ce que fait « cocher » sur une tâche répétée, sans rien cocher ni ajouter à l'insu de l'utilisateur, et sans
job planifié (ADR 0007 pas encore en place).

Décision :

- Une seule ligne par tâche répétée. La cocher valide l'occurrence : la tâche reste à faire et son échéance passe à la
  **première occurrence strictement après aujourd'hui et après l'échéance actuelle**, comptée depuis l'**ancre** de la
  série (voir Stockage). Une tâche cochée en retard saute les occurrences passées. Aucune tâche n'est créée.
- Rythmes : tous les N jours, semaines, mois ou ans (N de 1 à 99). Un jour absent du mois d'arrivée (31, 29 février)
  devient le dernier jour du mois, sans glissement pour les suivantes : toutes les occurrences se calculent depuis
  l'ancre, jamais depuis l'échéance précédente (« le 31 » donne 28 février puis 31 mars).
- Procédure dédiée `todo.tasks.completeOccurrence` (`version` + `today`, jour de l'appareil : le serveur ne connaît pas
  le fuseau). Rejouer la même coche ⇒ `CONFLICT STALE_VERSION`, jamais deux avances. `setDone` garde son sens :
  terminer pour de bon. Arrêter la répétition : retirer la règle (`update`, `recurrence: null`).
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
