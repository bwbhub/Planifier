import { AGENDA_IMPORT_FUTURE_DAYS, AGENDA_IMPORT_PAST_DAYS } from "@planifier/constants/agenda";
import { addDays, utcDateToDay } from "@planifier/constants/days";
import { expandFeed } from "@planifier/domain-ical/expand";
import { parseFeed } from "@planifier/domain-ical/parse";
import type { ImportedEntry } from "@planifier/domain-ical/types";

/** Identifiant d'origine trop long pour être le d'un vrai agenda : écarté plutôt que stocké. */
const MAX_UID_LENGTH = 512;

/**
 * Texte d'un flux ⇒ entrées à importer : événements lus, séries développées de 30 jours avant aujourd'hui à 365
 * jours après (`AGENDA_IMPORT_*`). `null` si le texte n'est pas un agenda (page HTML, réponse vide).
 */
export function entriesOfFeed(text: string, now: Date): ImportedEntry[] | null {
  if (!/^BEGIN:VCALENDAR/im.test(text)) return null;
  const today = utcDateToDay(now);
  const { entries } = expandFeed(parseFeed(text).events, {
    from: addDays(today, -AGENDA_IMPORT_PAST_DAYS),
    to: addDays(today, AGENDA_IMPORT_FUTURE_DAYS),
  });
  return entries.filter((entry) => entry.uid.length <= MAX_UID_LENGTH);
}
