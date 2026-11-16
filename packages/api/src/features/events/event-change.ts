import { type EventChange, eventChangeSchema } from "@planifier/api-contract";
import type { ImportantChange } from "@planifier/domain-events/changes";
import type { EventWhen } from "@planifier/domain-events/when";

function whenToJson(when: EventWhen) {
  return when.allDay
    ? when
    : {
        allDay: false as const,
        startsAt: when.startsAt.toISOString(),
        endsAt: when.endsAt.toISOString(),
        openEnd: when.openEnd,
      };
}

/** Champ important modifié ⇒ contenu d'un commentaire `CHANGE`, validé par son schéma versionné avant d'être écrit. */
export function toChangeJson(change: ImportantChange): EventChange {
  return eventChangeSchema.parse(
    change.field === "when"
      ? {
          schemaVersion: 1,
          field: "when",
          from: whenToJson(change.from),
          to: whenToJson(change.to),
        }
      : { schemaVersion: 1, field: "location", from: change.from, to: change.to },
  );
}
