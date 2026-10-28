import {
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  TODO_LIST_MAX_TASKS,
} from "@planifier/constants/todo";
import { z } from "zod";

import { listIdSchema, listTargetSchema, taskIdSchema, taskTargetSchema } from "../todo.schemas";

const titleSchema = z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH);
/** Pas de description : champ absent (création) ou `null` (modification), jamais une chaîne vide. */
const descriptionSchema = z.string().trim().min(1).max(TASK_DESCRIPTION_MAX_LENGTH);
/** Jour d'échéance `AAAA-MM-JJ`, sans heure ni fuseau. */
const dueDateSchema = z.iso.date();

export const listTasksInputSchema = listTargetSchema;

export const createTaskInputSchema = z.strictObject({
  listId: listIdSchema,
  /** Tâche de la même liste dont celle-ci devient une sous-tâche ; absente : tâche de la liste. */
  parentId: taskIdSchema.optional(),
  title: titleSchema,
  description: descriptionSchema.optional(),
  dueDate: dueDateSchema.optional(),
});

/** Champs modifiés : au moins un ; `null` efface. `version` lue avec la tâche (concurrence optimiste). */
export const updateTaskInputSchema = z
  .strictObject({
    taskId: taskIdSchema,
    version: z.int().min(1),
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    dueDate: dueDateSchema.nullable().optional(),
  })
  .refine(
    ({ title, description, dueDate }) =>
      title !== undefined || description !== undefined || dueDate !== undefined,
    "Aucun champ à modifier.",
  );

/** Cocher ou décocher : un état demandé, pas une bascule, donc rejouable sans effet de bord. */
export const setTaskDoneInputSchema = taskTargetSchema.extend({ done: z.boolean() });

export const deleteTaskInputSchema = taskTargetSchema;

export const taskSchema = z.strictObject({
  id: taskIdSchema,
  listId: listIdSchema,
  /** null : tâche de la liste ; sinon, sous-tâche de cette tâche (un seul niveau). */
  parentId: taskIdSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: dueDateSchema.nullable(),
  /** null : à faire. */
  completedAt: z.date().nullable(),
  version: z.int(),
});

/** Toutes les tâches de la liste (bornées), sous-tâches comprises, par ordre de création. */
export const listTasksOutputSchema = z.strictObject({
  items: z.array(taskSchema).max(TODO_LIST_MAX_TASKS),
});

export type TaskOutput = z.infer<typeof taskSchema>;
export type ListTasksOutput = z.infer<typeof listTasksOutputSchema>;
export type CreateTaskInput = z.output<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.output<typeof updateTaskInputSchema>;
export type SetTaskDoneInput = z.output<typeof setTaskDoneInputSchema>;
