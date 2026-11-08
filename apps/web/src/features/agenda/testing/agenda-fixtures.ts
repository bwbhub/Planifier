import type { AgendaEntryOutput } from "@planifier/api-contract";

import type { AgendaItem } from "../utils/agenda-items";

// Aides de test : une entrée et un élément de grille, à compléter champ par champ.
export const NINE_TO_TEN = {
  allDay: false,
  startsAt: new Date("2026-11-05T09:00"),
  endsAt: new Date("2026-11-05T10:00"),
} as const;

export function entryWith(
  fields: Partial<AgendaEntryOutput> & Pick<AgendaEntryOutput, "id" | "title">,
): AgendaEntryOutput {
  return {
    location: null,
    participants: [],
    description: null,
    when: NINE_TO_TEN,
    tint: "general",
    hidden: false,
    taskId: null,
    imported: false,
    version: 1,
    ...fields,
  };
}

export function itemWith(
  fields: Partial<AgendaItem> & Pick<AgendaItem, "id" | "title">,
): AgendaItem {
  return {
    location: null,
    participants: [],
    when: NINE_TO_TEN,
    background: "bg-tint-general",
    owner: null,
    entry: null,
    ...fields,
  };
}
