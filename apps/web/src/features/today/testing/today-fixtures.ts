import type { AgendaEntryOutput, TodayTaskOutput } from "@planifier/api-contract";

// Aide de test : une tâche de l'écran Aujourd'hui et une entrée d'agenda, à compléter champ par champ.
const LIST = {
  id: "0199f3a2-7c4e-7d10-9a51-3b2f6c8e1d40",
  name: "Maison",
  tint: "general",
} as const;

export function todayTask(
  fields: Partial<TodayTaskOutput> & Pick<TodayTaskOutput, "id" | "title">,
): TodayTaskOutput {
  return {
    listId: LIST.id,
    parentId: null,
    description: null,
    dueDate: null,
    dueTime: null,
    completedAt: null,
    completedBy: null,
    assignee: null,
    recurrence: null,
    version: 1,
    list: LIST,
    ...fields,
  };
}

export function agendaEntry(
  fields: Partial<AgendaEntryOutput> & Pick<AgendaEntryOutput, "id" | "title">,
): AgendaEntryOutput {
  return {
    location: null,
    participants: [],
    when: { allDay: true, startDay: "2026-11-07", endDay: "2026-11-07" },
    description: null,
    tint: "general",
    hidden: false,
    taskId: null,
    version: 1,
    ...fields,
  };
}

export const EMPTY_SECTION = { items: [], total: 0 };
