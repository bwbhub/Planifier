/** Champs d'une heure murale (sans fuseau). */
export interface WallTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

/** Décalage (ms) de `timeZone` par rapport à UTC à l'instant `at`. `null` si le fuseau est inconnu. */
function offsetAt(at: number, timeZone: string): number | null {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    }).formatToParts(new Date(at));
    const value = (type: string) => Number(parts.find((part) => part.type === type)?.value);
    const local = Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute"),
      value("second"),
    );
    return local - Math.floor(at / 1000) * 1000;
  } catch {
    return null;
  }
}

/**
 * Instant d'une heure murale dans `timeZone` (nom IANA). Heure absente (passage à l'heure d'été) : décalée après le
 * saut ; heure double (retour à l'heure d'hiver) : la première. `null` si le fuseau est inconnu.
 */
export function wallTimeToInstant(wall: WallTime, timeZone: string): Date | null {
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute, wall.second);
  const first = offsetAt(asUtc, timeZone);
  if (first === null) return null;
  const guess = asUtc - first;
  const second = offsetAt(guess, timeZone) ?? first;
  return new Date(asUtc - second);
}
