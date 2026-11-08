import { MS_PER_DAY } from "@planifier/constants/days";

/** Champs d'une heure murale (sans fuseau). */
export interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const formatters = new Map<string, Intl.DateTimeFormat | null>();

/** Formateur du fuseau, gardé (en construire un coûte cher) ; `null` si le fuseau est inconnu. */
function formatterFor(timeZone: string): Intl.DateTimeFormat | null {
  const cached = formatters.get(timeZone);
  if (cached !== undefined) return cached;
  let formatter: Intl.DateTimeFormat | null = null;
  try {
    formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    });
  } catch {
    formatter = null;
  }
  formatters.set(timeZone, formatter);
  return formatter;
}

/** Décalage (ms) de `timeZone` par rapport à UTC à l'instant `at`. `null` si le fuseau est inconnu. */
function offsetAt(at: number, timeZone: string): number | null {
  const formatter = formatterFor(timeZone);
  if (formatter === null) return null;
  const parts = formatter.formatToParts(new Date(at));
  const value = (type: string): number => Number(parts.find((part) => part.type === type)?.value);
  const local = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );
  return Number.isNaN(local) ? null : local - Math.floor(at / 1000) * 1000;
}

/**
 * Instant d'une heure murale dans `timeZone` (nom IANA). Heure absente (passage à l'heure d'été) : décalée après le
 * saut ; heure double (retour à l'heure d'hiver) : la première. `null` si le fuseau est inconnu.
 */
export function wallTimeToInstant(wall: WallTime, timeZone: string): Date | null {
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  // Décalages en vigueur un jour avant et un jour après : l'heure murale peut tomber avant ou après un changement.
  const before = offsetAt(asUtc - MS_PER_DAY, timeZone);
  const after = offsetAt(asUtc + MS_PER_DAY, timeZone);
  if (before === null || after === null) return null;
  // Candidats cohérents avec leur propre décalage ; heure double ⇒ deux candidats, on prend le premier.
  const candidates = [before, after]
    .map((offset) => asUtc - offset)
    .filter((instant) => offsetAt(instant, timeZone) === asUtc - instant)
    .sort((a, b) => a - b);
  // Heure absente (saut de printemps) : aucun candidat, on décale après le saut.
  return new Date(candidates[0] ?? asUtc - Math.min(before, after));
}

/** Heure murale de `at` dans `timeZone`. `null` si le fuseau est inconnu. */
export function instantToWallTime(at: Date, timeZone: string): WallTime | null {
  const offset = offsetAt(at.getTime(), timeZone);
  if (offset === null) return null;
  const local = new Date(at.getTime() + offset);
  return {
    year: local.getUTCFullYear(),
    month: local.getUTCMonth() + 1,
    day: local.getUTCDate(),
    hour: local.getUTCHours(),
    minute: local.getUTCMinutes(),
    second: local.getUTCSeconds(),
  };
}
