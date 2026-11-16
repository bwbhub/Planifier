import type { EventWhen } from "./when";

/**
 * Champ important modifié (CONTEXT.md : lieu, date, heure). Chaque changement devient un message « Changement » en
 * tête des commentaires de l'événement.
 */
export type ImportantChange =
  | { field: "when"; from: EventWhen; to: EventWhen }
  | { field: "location"; from: string | null; to: string | null };

/**
 * Même date ? Sans fin choisie des deux côtés, la fin est déduite du début par l'appareil (minuit de son fuseau) :
 * elle ne compte pas, sinon une modification faite depuis un autre fuseau signalerait un changement qui n'en est pas
 * un. Passer de « fin du jour » à une heure de fin, ou l'inverse, en est un.
 */
function sameWhen(a: EventWhen, b: EventWhen): boolean {
  if (a.allDay && b.allDay) return a.startDay === b.startDay && a.endDay === b.endDay;
  if (a.allDay || b.allDay) return false;
  if (a.startsAt.getTime() !== b.startsAt.getTime() || a.openEnd !== b.openEnd) return false;
  return a.openEnd || a.endsAt.getTime() === b.endsAt.getTime();
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
