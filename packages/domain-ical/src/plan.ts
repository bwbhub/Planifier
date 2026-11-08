import type { EntryTime, ImportedEntry } from "./types";

/** Ce qu'une lecture du flux change dans les entrées déjà importées (ADR 0011 : upsert, jamais suppression-recréation). */
export interface UpsertPlan {
  /** Absentes ici, présentes dans le flux. */
  create: ImportedEntry[];
  /** Présentes des deux côtés, contenu différent : mises à jour, identifiant conservé. */
  update: ImportedEntry[];
  /** `uid` présents des deux côtés, contenu identique. */
  unchanged: string[];
  /** `uid` présents ici, disparus du flux (le miroir les supprime). */
  removed: string[];
}

function timeKey(time: EntryTime): string {
  return time.allDay
    ? `day:${time.startDay}:${time.endDay}`
    : `at:${time.startsAt.toISOString()}:${time.endsAt.toISOString()}`;
}

function contentKey({ title, description, location, time }: ImportedEntry): string {
  return JSON.stringify([title, description, location, timeKey(time)]);
}

/**
 * Compare les entrées déjà importées d'une source au flux relu, par `uid`. Un `uid` répété dans le flux compte une
 * fois (le dernier l'emporte). Fonction pure : l'appelant applique le plan dans une transaction.
 */
export function planUpsert(existing: ImportedEntry[], received: ImportedEntry[]): UpsertPlan {
  const known = new Map(existing.map((entry) => [entry.uid, entry]));
  const incoming = new Map(received.map((entry) => [entry.uid, entry]));
  const plan: UpsertPlan = { create: [], update: [], unchanged: [], removed: [] };
  for (const entry of incoming.values()) {
    const before = known.get(entry.uid);
    if (before === undefined) plan.create.push(entry);
    else if (contentKey(before) === contentKey(entry)) plan.unchanged.push(entry.uid);
    else plan.update.push(entry);
  }
  plan.removed = [...known.keys()].filter((uid) => !incoming.has(uid));
  return plan;
}
