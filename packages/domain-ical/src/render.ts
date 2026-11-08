import { addDays } from "@planifier/constants/days";

import { ORIGIN_PROPERTY, ORIGIN_VALUE, PRODUCT_ID, UID_SUFFIX } from "./origin";
import type { EntryTime, ExportEntry } from "./types";

const CRLF = "\r\n";
/** Longueur maximale d'une ligne, en octets, avant pliage (RFC 5545 §3.1). */
const MAX_LINE_OCTETS = 75;

/** Octets d'un caractère en UTF-8. */
function octets(char: string): number {
  const code = char.codePointAt(0) ?? 0;
  if (code < 0x80) return 1;
  if (code < 0x800) return 2;
  return code < 0x10000 ? 3 : 4;
}

function escapeText(value: string): string {
  return value
    .replaceAll("\\", "\\\\")
    .replaceAll(";", "\\;")
    .replaceAll(",", "\\,")
    .replaceAll(/\r\n|\r|\n/g, "\\n");
}

/** Plie une ligne à 75 octets sans couper un caractère ; les suites commencent par une espace (comptée). */
function fold(line: string): string[] {
  const parts: string[] = [];
  let current = "";
  let size = 0;
  for (const char of line) {
    const width = octets(char);
    const limit = parts.length === 0 ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (size + width > limit) {
      parts.push(current);
      current = "";
      size = 0;
    }
    current += char;
    size += width;
  }
  parts.push(current);
  return parts.map((part, index) => (index === 0 ? part : ` ${part}`));
}

/** `20261108T093000Z` */
function utcStamp(at: Date): string {
  return at
    .toISOString()
    .replaceAll(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

/** `20261108` */
function dayStamp(day: string): string {
  return day.replaceAll("-", "");
}

function timeLines(time: EntryTime): string[] {
  if (time.allDay) {
    return [
      `DTSTART;VALUE=DATE:${dayStamp(time.startDay)}`,
      // `DTEND` est exclusif en iCal : le lendemain du dernier jour.
      `DTEND;VALUE=DATE:${dayStamp(addDays(time.endDay, 1))}`,
    ];
  }
  return [`DTSTART:${utcStamp(time.startsAt)}`, `DTEND:${utcStamp(time.endsAt)}`];
}

function eventLines(entry: ExportEntry, now: Date): string[] {
  return [
    "BEGIN:VEVENT",
    `UID:${entry.id}${UID_SUFFIX}`,
    `DTSTAMP:${utcStamp(now)}`,
    `${ORIGIN_PROPERTY}:${ORIGIN_VALUE}`,
    `SUMMARY:${escapeText(entry.title)}`,
    ...(entry.description === null ? [] : [`DESCRIPTION:${escapeText(entry.description)}`]),
    ...(entry.location === null ? [] : [`LOCATION:${escapeText(entry.location)}`]),
    ...timeLines(entry.time),
    "END:VEVENT",
  ];
}

/**
 * Flux iCal de ces entrées. Chaque événement porte le marquage anti-boucle (`PRODID` et `X-PLANIFIER-ORIGIN`) : relu
 * par Planifier, il est ignoré. `now` est fourni par l'appelant (`DTSTAMP`).
 */
export function renderFeed(entries: ExportEntry[], now: Date): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:${PRODUCT_ID}`,
    "CALSCALE:GREGORIAN",
    ...entries.flatMap((entry) => eventLines(entry, now)),
    "END:VCALENDAR",
  ];
  return lines.flatMap(fold).join(CRLF) + CRLF;
}
