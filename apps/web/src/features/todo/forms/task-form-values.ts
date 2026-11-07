import type { TaskOutput } from "@planifier/api-contract";

import { assigneeFromForm } from "../utils/assignees";
import { recurrenceChange, recurrenceFromForm, type RecurrenceDraft } from "../utils/recurrence";

/** Champ facultatif laissé vide : `null`. */
function optionalText(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" && value.trim() !== "" ? value : null;
}

/** Ce que le formulaire contient, brut : le contrat décide si c'est valide. */
export interface TaskFormValues {
  title: FormDataEntryValue | null;
  description: string | null;
  dueDate: string | null;
  dueTime: string | null;
  recurrence: RecurrenceDraft | null;
  /** `undefined` : pas de champ (liste non partagée), l'assigné ne change pas. */
  assigneeId: string | null | undefined;
}

export function readTaskForm(data: FormData): TaskFormValues {
  return {
    title: data.get("title"),
    description: optionalText(data.get("description")),
    dueDate: optionalText(data.get("dueDate")),
    dueTime: optionalText(data.get("dueTime")),
    recurrence: recurrenceFromForm(data),
    assigneeId: assigneeFromForm(data.get("assigneeId")),
  };
}

/** Création : un champ vide est absent. */
export function createValues(listId: string, parentId: string | undefined, values: TaskFormValues) {
  return {
    listId,
    parentId,
    title: values.title,
    description: values.description ?? undefined,
    dueDate: values.dueDate ?? undefined,
    dueTime: values.dueTime ?? undefined,
    recurrence: values.recurrence ?? undefined,
    assigneeId: values.assigneeId ?? undefined,
  };
}

/**
 * Modification : un champ vidé vaut `null`, il est effacé. Jour, heure et répétition ne sont envoyés que s'ils changent :
 * les renvoyer remet à zéro l'ancre de la série (rien ne doit changer à l'insu de l'utilisateur).
 */
export function updateValues(
  task: TaskOutput,
  version: number | undefined,
  values: TaskFormValues,
) {
  return {
    taskId: task.id,
    version,
    title: values.title,
    description: values.description,
    dueDate: values.dueDate === task.dueDate ? undefined : values.dueDate,
    dueTime: values.dueTime === task.dueTime ? undefined : values.dueTime,
    recurrence: recurrenceChange(task.recurrence, values.recurrence),
    assigneeId: values.assigneeId,
  };
}
