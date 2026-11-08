import { addDays, daysBetween, utcDateToDay } from "@planifier/constants/days";

import { candidateDays } from "./candidates";
import { parseRule, type Rule } from "./recurrence-rule";
import { instantToWallTime, wallTimeToInstant } from "./timezone";
import type { EntryTime, FeedEvent, FeedRecurrence, ImportedEntry } from "./types";

/** Fenêtre de développement des séries : jours `AAAA-MM-JJ`, bornes incluses. */
export interface ExpandWindow {
  from: string;
  to: string;
}

export interface ExpandedFeed {
  entries: ImportedEntry[];
  /** Séries dont la règle n'est pas prise en charge : seule leur première occurrence est gardée. */
  unsupported: number;
}

/** Candidats examinés au plus par série : une règle absurde ne boucle pas. */
const MAX_CANDIDATES = 20_000;

/** Jour local et clé d'exception d'une occurrence, avec son moment. */
interface Occurrence {
  key: string;
  startDay: string;
  endDay: string;
  time: EntryTime;
}

type OccurrenceAt = (day: string) => Occurrence | null;

/** Jour civil de `at` dans `zone` (UTC si absent ou inconnu). */
function localDay(at: Date, zone: string | null): string {
  const wall = zone === null ? null : instantToWallTime(at, zone);
  if (wall === null) return utcDateToDay(at);
  return `${String(wall.year).padStart(4, "0")}-${String(wall.month).padStart(2, "0")}-${String(wall.day).padStart(2, "0")}`;
}

/** Fabrique des occurrences d'une série à partir de son premier événement. */
function occurrenceMaker(event: FeedEvent): { firstDay: string; at: OccurrenceAt } | null {
  const { time, recurrence } = event;
  if (time.allDay) {
    const span = daysBetween(time.startDay, time.endDay);
    return {
      firstDay: time.startDay,
      at: (day) => ({
        key: day,
        startDay: day,
        endDay: addDays(day, span),
        time: { allDay: true, startDay: day, endDay: addDays(day, span) },
      }),
    };
  }
  const length = time.endsAt.getTime() - time.startsAt.getTime();
  const zone = recurrence?.timeZone ?? null;
  const wall = zone === null ? null : instantToWallTime(time.startsAt, zone);
  const finish = (startsAt: Date, day: string): Occurrence => {
    const endsAt = new Date(startsAt.getTime() + length);
    return {
      key: startsAt.toISOString(),
      startDay: day,
      endDay: localDay(endsAt, zone),
      time: { allDay: false, startsAt, endsAt },
    };
  };
  if (zone === null || wall === null) {
    // Sans fuseau (UTC) : même heure UTC chaque jour retenu.
    const firstDay = utcDateToDay(time.startsAt);
    const offset = time.startsAt.getTime() - Date.parse(`${firstDay}T00:00:00Z`);
    return {
      firstDay,
      at: (day) => finish(new Date(Date.parse(`${day}T00:00:00Z`) + offset), day),
    };
  }
  const firstDay = `${String(wall.year).padStart(4, "0")}-${String(wall.month).padStart(2, "0")}-${String(wall.day).padStart(2, "0")}`;
  return {
    firstDay,
    at: (day) => {
      const [year = 0, month = 0, dom = 0] = day.split("-").map(Number);
      const startsAt = wallTimeToInstant({ ...wall, year, month, day: dom }, zone);
      return startsAt === null ? null : finish(startsAt, day);
    },
  };
}

function inWindow({ startDay, endDay }: Occurrence, { from, to }: ExpandWindow): boolean {
  return startDay <= to && endDay >= from;
}

/** `UNTIL` avec heure : instant exact pour un événement horodaté ; sinon, le jour. */
function beforeUntil(rule: Rule, occurrence: Occurrence): boolean {
  const { until } = rule;
  if (until === null) return true;
  if (until.at !== null && !occurrence.time.allDay) return occurrence.time.startsAt <= until.at;
  return occurrence.startDay <= until.day;
}

/** La série est-elle épuisée avant ce jour (`COUNT` atteint ou fenêtre dépassée) ? */
function finished(rule: Rule, day: string, examined: number, window: ExpandWindow): boolean {
  return day > window.to || (rule.count !== null && examined >= rule.count);
}

/** Occurrences d'une série dans la fenêtre, sans celles de `skipped` (exceptions et occurrences remplacées). */
function seriesOccurrences(
  event: FeedEvent,
  rule: Rule,
  window: ExpandWindow,
  skipped: Set<string>,
): Occurrence[] | null {
  const maker = occurrenceMaker(event);
  if (maker === null) return null;
  const found: Occurrence[] = [];
  let examined = 0;
  for (const day of candidateDays(maker.firstDay, rule)) {
    if (finished(rule, day, examined, window)) return found;
    // Série qui n'atteint pas la fenêtre dans le plafond : non développée (comptée), plutôt que tronquée en silence.
    if (examined >= MAX_CANDIDATES) return null;
    examined += 1;
    const occurrence = maker.at(day);
    if (occurrence === null) continue;
    if (!beforeUntil(rule, occurrence)) return found;
    if (inWindow(occurrence, window) && !skipped.has(occurrence.key)) found.push(occurrence);
  }
  return found;
}

function entryOf(event: FeedEvent, uid: string, time: EntryTime): ImportedEntry {
  return {
    uid,
    title: event.title,
    description: event.description,
    location: event.location,
    time,
  };
}

function single(event: FeedEvent): ImportedEntry {
  return entryOf(event, event.uid, event.time);
}

/** Entrées d'une série : ses occurrences dans la fenêtre, ou sa seule première occurrence si la règle n'est pas prise en charge. */
function expandSeries(
  event: FeedEvent,
  recurrence: FeedRecurrence,
  replacements: FeedEvent[],
  window: ExpandWindow,
): { entries: ImportedEntry[]; unsupported: boolean } {
  const skipped = new Set([
    ...recurrence.exceptions,
    ...replacements
      .filter((other) => other.uid === event.uid)
      .flatMap((other) => (other.replaces === null ? [] : [other.replaces])),
  ]);
  const rule = parseRule(recurrence.rule);
  const occurrences = rule === null ? null : seriesOccurrences(event, rule, window, skipped);
  if (occurrences === null) return { entries: [single(event)], unsupported: true };
  return {
    entries: occurrences.map((o) => entryOf(event, `${event.uid}#${o.key}`, o.time)),
    unsupported: false,
  };
}

/** Occurrence modifiée (`RECURRENCE-ID`) : gardée si elle touche la fenêtre (à un jour près, faute de fuseau). */
function replacementEntry(replacement: FeedEvent, window: ExpandWindow): ImportedEntry[] {
  const { time } = replacement;
  const startDay = time.allDay ? time.startDay : utcDateToDay(time.startsAt);
  const endDay = time.allDay ? time.endDay : utcDateToDay(time.endsAt);
  if (startDay > addDays(window.to, 1) || endDay < addDays(window.from, -1)) return [];
  return [entryOf(replacement, `${replacement.uid}#${replacement.replaces ?? ""}`, time)];
}

/**
 * Développe un flux en entrées : une par événement simple (toutes gardées), une par occurrence dans la fenêtre pour
 * une série (`uid#occurrence`, `occurrence` = jour ou instant ISO), les exceptions retirées (`EXDATE`) et les
 * occurrences remplacées (`RECURRENCE-ID`) par leur version modifiée. Une règle non prise en charge garde la première
 * occurrence seule, comptée dans `unsupported`.
 */
export function expandFeed(events: FeedEvent[], window: ExpandWindow): ExpandedFeed {
  const replacements = events.filter((event) => event.replaces !== null);
  const entries: ImportedEntry[] = [];
  let unsupported = 0;
  for (const event of events.filter((candidate) => candidate.replaces === null)) {
    if (event.recurrence === null) {
      entries.push(single(event));
      continue;
    }
    const series = expandSeries(event, event.recurrence, replacements, window);
    entries.push(...series.entries);
    if (series.unsupported) unsupported += 1;
  }
  entries.push(...replacements.flatMap((replacement) => replacementEntry(replacement, window)));
  return { entries, unsupported };
}
