/** Moment d'une entrée : jours civils (`endDay` inclus, comme l'Agenda) ou instants. */
export type EntryTime =
  | { allDay: true; startDay: string; endDay: string }
  | { allDay: false; startsAt: Date; endsAt: Date };

/** Ce qu'un flux iCal apporte à une entrée d'agenda ; `uid` devient `sourceUid` (ADR 0011). */
export interface ImportedEntry {
  uid: string;
  title: string;
  description: string | null;
  location: string | null;
  time: EntryTime;
}

/** Règle de répétition d'un événement du flux, telle que lue (le développement en occurrences vient après). */
export interface FeedRecurrence {
  /** Valeur brute de `RRULE`, sans le nom. */
  rule: string;
  /** Occurrences retirées (`EXDATE`) : jours `AAAA-MM-JJ` ou instants ISO. */
  exceptions: string[];
}

/** Événement lu dans un flux. */
export interface FeedEvent extends ImportedEntry {
  recurrence: FeedRecurrence | null;
  /** Événement qui remplace une occurrence d'une série (`RECURRENCE-ID`) : jour ou instant ISO de l'occurrence. */
  replaces: string | null;
}

/** Entrée de Planifier à exporter. */
export interface ExportEntry {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  time: EntryTime;
}
