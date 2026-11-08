import { addDays } from "@planifier/constants/days";

import type { ContentLine } from "./content-lines";
import { type WallTime, wallTimeToInstant } from "./timezone";

/** Date ou instant d'une propriété `DTSTART`, `DTEND`, `EXDATE`, `RECURRENCE-ID`. */
export type ParsedMoment = { kind: "day"; day: string } | { kind: "instant"; at: Date };

const DAY = /^(\d{4})(\d{2})(\d{2})$/;
const DATE_TIME = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/;

function parseDay(value: string): ParsedMoment | null {
  const day = DAY.exec(value);
  if (!day) return null;
  const iso = `${day[1] ?? ""}-${day[2] ?? ""}-${day[3] ?? ""}`;
  return Number.isNaN(Date.parse(iso)) ? null : { kind: "day", day: iso };
}

/** Six champs `[année, mois, jour, heure, minute, seconde]` d'une heure iCal. */
function fieldsOf(match: RegExpExecArray): WallTime {
  const [year = 0, month = 0, day = 0, hour = 0, minute = 0, second = 0] = match
    .slice(1, 7)
    .map(Number);
  return { year, month, day, hour, minute, second };
}

function parseDateTime(value: string, zone: string | undefined): ParsedMoment | null {
  const match = DATE_TIME.exec(value);
  if (!match) return null;
  const wall = fieldsOf(match);
  const utc = match[7] === "Z" || zone === undefined;
  const at = utc
    ? new Date(Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second))
    : wallTimeToInstant(wall, zone);
  return at === null || Number.isNaN(at.getTime()) ? null : { kind: "instant", at };
}

/**
 * Lit une valeur de date. Jour seul (`VALUE=DATE`) ⇒ jour civil. Heure en UTC (`Z`) ⇒ instant. Heure avec `TZID`
 * (nom IANA) ⇒ instant. Heure « flottante » (ni `Z` ni `TZID`) : lue comme UTC, faute de fuseau à lui donner.
 * `null` si la valeur n'a pas la forme attendue ou si le fuseau est inconnu.
 */
export function parseMoment({
  params,
  value,
}: Pick<ContentLine, "params" | "value">): ParsedMoment | null {
  return parseDay(value) ?? parseDateTime(value, params["TZID"]);
}

/** Forme texte stable d'un moment (clé d'exception) : `AAAA-MM-JJ` ou instant ISO. */
export function momentKey(moment: ParsedMoment): string {
  return moment.kind === "day" ? moment.day : moment.at.toISOString();
}

const DURATION = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/;

/** Durée iCal (`PT1H30M`, `P1D`, `P2W`) en millisecondes ; `null` si illisible ou vide. */
export function parseDurationMs(value: string): number | null {
  const match = DURATION.exec(value);
  if (!match) return null;
  const [weeks, days, hours, minutes, seconds] = match.slice(2, 7).map((part) => Number(part || 0));
  const total =
    ((((weeks ?? 0) * 7 + (days ?? 0)) * 24 + (hours ?? 0)) * 60 + (minutes ?? 0)) * 60 +
    (seconds ?? 0);
  if (total === 0) return null;
  return (match[1] === "-" ? -1 : 1) * total * 1000;
}

/** Fin inclusive d'un événement sur jours entiers : `DTEND` est exclusif en iCal, jamais avant le début. */
export function inclusiveEndDay(startDay: string, exclusiveEnd: string | null): string {
  if (exclusiveEnd === null) return startDay;
  const last = addDays(exclusiveEnd, -1);
  return last < startDay ? startDay : last;
}
