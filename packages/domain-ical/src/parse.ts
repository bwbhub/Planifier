import {
  AGENDA_DESCRIPTION_MAX_LENGTH,
  AGENDA_LOCATION_MAX_LENGTH,
  AGENDA_TITLE_MAX_LENGTH,
} from "@planifier/constants/agenda";
import { addDays, MS_PER_DAY, utcDateToDay } from "@planifier/constants/days";

import { type ContentLine, parseContentLine, unescapeText, unfold } from "./content-lines";
import {
  inclusiveEndDay,
  momentKey,
  type ParsedMoment,
  parseDurationMs,
  parseMoment,
} from "./datetime";
import { isOwnExportEvent, isOwnExportProductId } from "./origin";
import type { EntryTime, FeedEvent, FeedRecurrence } from "./types";

/** Événements lus au plus par flux (le reste est ignoré) : un flux hostile ne peut pas gonfler la base. */
export const MAX_EVENTS = 5000;
const UNTITLED = "Sans titre";

/** Ce que la lecture d'un flux écarte, par raison. */
export interface IgnoredCounts {
  /** Événements que Planifier a lui-même exportés (anti-boucle, ADR 0011). */
  ownExport: number;
  /** Événements annulés à la source. */
  cancelled: number;
  /** Événements sans identifiant, sans début lisible ou dans un fuseau inconnu. */
  invalid: number;
}

export interface ParsedFeed {
  events: FeedEvent[];
  ignored: IgnoredCounts;
}

/** Au plus 4 unités UTF-16 par caractère gardé : tronquer d'abord évite de décomposer un texte énorme. */
function clip(value: string, max: number): string {
  const characters = Array.from(value.trim().slice(0, max * 4));
  return characters.length > max ? characters.slice(0, max).join("") : characters.join("");
}

/** Texte optionnel : retiré s'il est vide, borné à la longueur des champs de l'Agenda. */
function optionalText(line: ContentLine | undefined, max: number): string | null {
  const text = line === undefined ? "" : clip(unescapeText(line.value), max);
  return text === "" ? null : text;
}

function firstOf(lines: ContentLine[], name: string): ContentLine | undefined {
  return lines.find((line) => line.name === name);
}

function momentOf(line: ContentLine | undefined): ParsedMoment | null {
  return line === undefined ? null : parseMoment(line);
}

/** Jour civil d'un moment (un instant se lit en UTC). */
function dayOf(moment: ParsedMoment): string {
  return moment.kind === "day" ? moment.day : utcDateToDay(moment.at);
}

function allDayTime(
  startDay: string,
  end: ParsedMoment | null,
  durationMs: number | null,
): EntryTime {
  if (end !== null)
    return { allDay: true, startDay, endDay: inclusiveEndDay(startDay, dayOf(end)) };
  if (durationMs !== null && durationMs > 0) {
    const days = Math.ceil(durationMs / MS_PER_DAY);
    return { allDay: true, startDay, endDay: inclusiveEndDay(startDay, addDays(startDay, days)) };
  }
  return { allDay: true, startDay, endDay: startDay };
}

function timedTime(startsAt: Date, end: ParsedMoment | null, durationMs: number | null): EntryTime {
  const endAt =
    end?.kind === "instant" ? end.at : new Date(startsAt.getTime() + Math.max(durationMs ?? 0, 0));
  return { allDay: false, startsAt, endsAt: endAt < startsAt ? startsAt : endAt };
}

function timeOf(lines: ContentLine[]): EntryTime | null {
  const start = momentOf(firstOf(lines, "DTSTART"));
  if (start === null) return null;
  const end = momentOf(firstOf(lines, "DTEND"));
  const duration = firstOf(lines, "DURATION");
  const durationMs = duration === undefined ? null : parseDurationMs(duration.value);
  return start.kind === "day"
    ? allDayTime(start.day, end, durationMs)
    : timedTime(start.at, end, durationMs);
}

/** Occurrences retirées : `EXDATE` peut se répéter et lister plusieurs valeurs séparées par des virgules. */
function exceptionsOf(lines: ContentLine[]): string[] {
  const keys: string[] = [];
  for (const line of lines.filter((candidate) => candidate.name === "EXDATE")) {
    for (const value of line.value.split(",")) {
      const moment = parseMoment({ params: line.params, value: value.trim() });
      if (moment !== null) keys.push(momentKey(moment));
    }
  }
  return keys;
}

function recurrenceOf(lines: ContentLine[]): FeedRecurrence | null {
  const rule = firstOf(lines, "RRULE")?.value.trim();
  if (rule === undefined || rule === "") return null;
  return {
    rule,
    timeZone: firstOf(lines, "DTSTART")?.params["TZID"] ?? null,
    exceptions: exceptionsOf(lines),
  };
}

type Built = { event: FeedEvent } | { skipped: keyof IgnoredCounts };

function buildEvent(lines: ContentLine[]): Built {
  if (isOwnExportEvent(lines)) return { skipped: "ownExport" };
  if (firstOf(lines, "STATUS")?.value.trim().toUpperCase() === "CANCELLED") {
    return { skipped: "cancelled" };
  }
  const uid = firstOf(lines, "UID")?.value.trim() ?? "";
  const time = timeOf(lines);
  if (uid === "" || time === null) return { skipped: "invalid" };
  const replaces = momentOf(firstOf(lines, "RECURRENCE-ID"));
  const summary = firstOf(lines, "SUMMARY");
  return {
    event: {
      uid,
      title: optionalText(summary, AGENDA_TITLE_MAX_LENGTH) ?? UNTITLED,
      description: optionalText(firstOf(lines, "DESCRIPTION"), AGENDA_DESCRIPTION_MAX_LENGTH),
      location: optionalText(firstOf(lines, "LOCATION"), AGENDA_LOCATION_MAX_LENGTH),
      time,
      recurrence: recurrenceOf(lines),
      replaces: replaces === null ? null : momentKey(replaces),
    },
  };
}

/** Les lignes de chaque `VEVENT`, sous-composants (`VALARM`…) écartés. */
function eventBlocks(lines: ContentLine[]): ContentLine[][] {
  const blocks: ContentLine[][] = [];
  let current: ContentLine[] | null = null;
  let depth = 0;
  for (const line of lines) {
    if (current === null) {
      if (line.name === "BEGIN" && line.value.toUpperCase() === "VEVENT") current = [];
    } else if (line.name === "BEGIN") {
      depth += 1;
    } else if (line.name === "END" && depth > 0) {
      depth -= 1;
    } else if (line.name === "END") {
      blocks.push(current);
      current = null;
    } else if (depth === 0) {
      current.push(line);
    }
  }
  return blocks;
}

/**
 * Lit un flux iCal (RFC 5545) : les événements exploitables et le décompte de ceux qu'on écarte. Les répétitions
 * sont lues, pas développées. Un texte qui n'est pas un flux donne simplement zéro événement.
 */
export function parseFeed(text: string): ParsedFeed {
  const lines = unfold(text).flatMap((raw) => parseContentLine(raw) ?? []);
  const events: FeedEvent[] = [];
  const ignored: IgnoredCounts = { ownExport: 0, cancelled: 0, invalid: 0 };
  const feedIsOwn = lines.some(isOwnExportProductId);
  for (const block of eventBlocks(lines).slice(0, MAX_EVENTS)) {
    const built = buildEvent(block);
    if ("skipped" in built) ignored[built.skipped] += 1;
    else if (feedIsOwn) ignored.ownExport += 1;
    else events.push(built.event);
  }
  return { events, ignored };
}
