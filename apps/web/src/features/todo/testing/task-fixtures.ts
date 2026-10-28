import type { TaskOutput } from "@planifier/api-contract";

// Aide de test : une tâche de liste, à compléter champ par champ.
export const LIST_ID = "0199f3a2-7c4e-7d10-9a51-3b2f6c8e1d40";

export function taskWith(
  fields: Partial<TaskOutput> & Pick<TaskOutput, "id" | "title">,
): TaskOutput {
  return {
    listId: LIST_ID,
    parentId: null,
    description: null,
    dueDate: null,
    completedAt: null,
    recurrence: null,
    version: 1,
    ...fields,
  };
}
