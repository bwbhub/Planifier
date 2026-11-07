# 0018 — Heure d'échéance : texte `HH:MM` sans fuseau

Statut : accepté · Date : 2026-11-07

Contexte : l'écran « Nouvelle tâche » demande une heure à côté du jour d'échéance. Jusqu'ici l'échéance est un jour
civil (`tasks.due_date`, `DATE`), sans heure ni fuseau.

Décision :

- Colonne `tasks.due_time`, `VARCHAR(5)`, au format `HH:MM` (00:00 à 23:59), **heure murale** de l'utilisateur : sans
  fuseau, comme le jour. « 18:00 » reste « 18:00 » quel que soit l'endroit où l'on lit. Même choix que pour le jour
  (ADR 0017 : le serveur ne connaît pas le fuseau).
- Deux contraintes en base : le format, et « une heure demande un jour » (`due_time IS NULL OR due_date IS NOT NULL`).
- Contrat additif : `dueTime` (création, modification, sortie). La création refuse une heure sans jour ; la
  modification refuse de poser une heure sur une tâche sans jour (`CONFLICT TIME_WITHOUT_DATE`). Effacer le jour efface
  l'heure avec lui ; déplacer le jour garde l'heure.
- La récurrence garde l'heure d'une occurrence à l'autre (seul le jour avance). Une tâche n'est « en retard » qu'à partir
  du lendemain de son jour, heure ou non : pas de reproche à l'heure près (`CONTEXT.md`).
- L'heure ne déclenche rien : aucun rappel ni envoi (pas de tâches planifiées, ADR 0017).

Alternatives écartées :

- `TIME` Prisma : rendu en `Date` du 1er janvier 1970, un faux instant qui invite à y appliquer un fuseau.
- Un instant (`TIMESTAMPTZ`) : demande le fuseau de l'utilisateur côté serveur, et fait glisser « 18:00 » avec lui.
- Minutes depuis minuit (`INT`) : plus difficile à lire en base et à relire en revue, sans gain réel.
