import { WEEKDAYS } from "@planifier/constants/days";

export type Frequency = "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

/** Règle de répétition prise en charge (sous-ensemble courant de `RRULE`, RFC 5545 §3.3.10). */
export interface Rule {
  frequency: Frequency;
  interval: number;
  count: number | null;
  /** Fin de la série : jour `AAAA-MM-JJ` (UTC) et, si `UNTIL` donnait une heure, l'instant exact. */
  until: { day: string; at: Date | null } | null;
  /** Jours de la semaine (lundi = 0), triés ; vide si non précisé. */
  byDay: number[];
  /** Jours du mois, triés ; vide si non précisé. */
  byMonthDay: number[];
}

const FREQUENCIES: readonly string[] = ["DAILY", "WEEKLY", "MONTHLY", "YEARLY"];
const WEEKDAY_CODES = WEEKDAYS.map((name) => name.slice(0, 2));
const MAX_INTERVAL = 1000;
const MAX_COUNT = 100_000;

function positiveInt(value: string | undefined, max: number): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 1 && parsed <= max ? parsed : null;
}

/** `20261231` ⇒ jour ; `20261231T235959Z` ⇒ jour et instant (UTC). */
function parseUntil(value: string): { day: string; at: Date | null } | null {
  const match = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2})Z?)?$/.exec(value);
  if (!match) return null;
  const day = `${match[1] ?? ""}-${match[2] ?? ""}-${match[3] ?? ""}`;
  if (match[4] === undefined) return Number.isNaN(Date.parse(day)) ? null : { day, at: null };
  const at = new Date(`${day}T${match[4]}:${match[5] ?? ""}:${match[6] ?? ""}Z`);
  return Number.isNaN(at.getTime()) ? null : { day, at };
}

/** `MO,WE` ⇒ `[0, 2]` ; `null` si un jour est inconnu ou porte un rang (`2MO`, non pris en charge). */
function parseByDay(value: string): number[] | null {
  const indexes: number[] = [];
  for (const code of value.split(",")) {
    const index = WEEKDAY_CODES.indexOf(code);
    if (index < 0) return null;
    indexes.push(index);
  }
  return [...new Set(indexes)].sort((a, b) => a - b);
}

/** `1,15` ⇒ `[1, 15]` ; `null` si une valeur sort de 1 à 31 (les jours depuis la fin du mois ne sont pas pris en charge). */
function parseByMonthDay(value: string): number[] | null {
  const days = value.split(",").map((part) => positiveInt(part, 31));
  return days.every((day) => day !== null) ? [...new Set(days)].sort((a, b) => a - b) : null;
}

/** Parties `CLE=valeur` ; `null` si une clé est répétée. */
function parts(rule: string): Map<string, string> | null {
  const map = new Map<string, string>();
  for (const part of rule.split(";")) {
    const [key = "", value = ""] = part.split("=");
    if (map.has(key.toUpperCase())) return null;
    map.set(key.toUpperCase(), value.toUpperCase());
  }
  return map;
}

/** Clés comprises ; toute autre (`BYSETPOS`, `BYMONTH`…) rend la règle non prise en charge plutôt que mal développée. */
/** Seule la semaine qui commence le lundi (valeur par défaut) est prise en charge. */
const SUPPORTED_WEEK_START = "MO";
const SUPPORTED_KEYS = new Set([
  "FREQ",
  "INTERVAL",
  "COUNT",
  "UNTIL",
  "BYDAY",
  "BYMONTHDAY",
  "WKST",
]);

function isFrequency(value: string): value is Frequency {
  return FREQUENCIES.includes(value);
}

/** Valeur d'une clé facultative : `fallback` si absente, `null` si présente mais illisible. */
function optional<T>(
  map: Map<string, string>,
  key: string,
  read: (v: string) => T | null,
  fallback: T,
): T | null {
  const value = map.get(key);
  return value === undefined ? fallback : read(value);
}

type Fields = Omit<Rule, "frequency">;

/** Champs facultatifs d'une règle ; `null` si l'un est présent mais illisible. */
function readFields(map: Map<string, string>): Fields | null {
  const interval = optional(map, "INTERVAL", (v) => positiveInt(v, MAX_INTERVAL), 1);
  const count = optional(map, "COUNT", (v) => positiveInt(v, MAX_COUNT), null);
  const until = optional(map, "UNTIL", parseUntil, null);
  const byDay = optional(map, "BYDAY", parseByDay, []);
  const byMonthDay = optional(map, "BYMONTHDAY", parseByMonthDay, []);
  const unreadable = (map.has("COUNT") && count === null) || (map.has("UNTIL") && until === null);
  if (interval === null || byDay === null || byMonthDay === null || unreadable) return null;
  return { interval, count, until, byDay, byMonthDay };
}

/** Combinaisons qu'on sait développer : `BYDAY` avec `WEEKLY`, `BYMONTHDAY` avec `MONTHLY`, semaine du lundi. */
function isSupported(
  frequency: Frequency,
  fields: Fields,
  weekStart = SUPPORTED_WEEK_START,
): boolean {
  const dayRuleMisplaced = fields.byDay.length > 0 && frequency !== "WEEKLY";
  const monthDayMisplaced = fields.byMonthDay.length > 0 && frequency !== "MONTHLY";
  return weekStart === SUPPORTED_WEEK_START && !dayRuleMisplaced && !monthDayMisplaced;
}

/**
 * Lit une `RRULE`. `null` si elle utilise ce qu'on ne développe pas (rangs de jours, `BYSETPOS`…) ou si elle est
 * illisible : l'appelant garde alors la seule première occurrence.
 */
export function parseRule(rule: string): Rule | null {
  const map = parts(rule);
  if (map === null || ![...map.keys()].every((key) => SUPPORTED_KEYS.has(key))) return null;
  const frequency = map.get("FREQ") ?? "";
  const fields = readFields(map);
  if (!isFrequency(frequency) || fields === null) return null;
  return isSupported(frequency, fields, map.get("WKST")) ? { frequency, ...fields } : null;
}
