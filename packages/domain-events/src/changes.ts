import type { EventWhen } from "./when";

/**
 * Champ important modifié (CONTEXT.md : lieu, date, heure). Chaque changement devient un message « Changement » en
 * tête des commentaires de l'événement.
 */
export type ImportantChange =
  | { field: "when"; from: EventWhen; to: EventWhen }
  | { field: "location"; from: string | null; to: string | null };

/** Fin choisie ou non, pour l'horaire : passer de « fin du jour » à une heure de fin est un changement. */
function sameWhen(a: EventWhen, b: EventWhen): boolean {
  if (a.allDay && b.allDay) return a.startDay === b.startDay && a.endDay === b.endDay;
  if (!a.allDay && !b.allDay) {
    return (
      a.startsAt.getTime() === b.startsAt.getTime() &&
      a.endsAt.getTime() === b.endsAt.getTime() &&
      a.openEnd === b.openEnd
    );
  }
  return false;
}

/** Champs importants qui diffèrent entre deux versions d'un événement (le titre et les infos ne comptent pas). */
export function importantChanges(
  before: { when: EventWhen; location: string | null },
  after: { when: EventWhen; location: string | null },
): ImportantChange[] {
  const changes: ImportantChange[] = [];
  if (!sameWhen(before.when, after.when)) {
    changes.push({ field: "when", from: before.when, to: after.when });
  }
  if (before.location !== after.location) {
    changes.push({ field: "location", from: before.location, to: after.location });
  }
  return changes;
}
