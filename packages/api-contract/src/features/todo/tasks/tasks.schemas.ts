import {
  LIST_TINTS,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  TODAY_SECTION_MAX,
  TODO_LIST_MAX_TASKS,
} from "@planifier/constants/todo";
import { z } from "zod";

import { personSchema } from "../../_shared/person.schemas";
import {
  listIdSchema,
  listTargetSchema,
  recurrenceSchema,
  taskIdSchema,
  taskTargetSchema,
  userIdSchema,
} from "../todo.schemas";

const titleSchema = z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH);
/** Pas de description : champ absent (création) ou `null` (modification), jamais une chaîne vide. */
const descriptionSchema = z.string().trim().min(1).max(TASK_DESCRIPTION_MAX_LENGTH);
/** Jour d'échéance `AAAA-MM-JJ`, sans heure ni fuseau. */
const dueDateSchema = z.iso.date();
/** Heure d'échéance `HH:MM` (00:00 à 23:59), heure murale de l'utilisateur : sans fuseau, comme le jour. */
const dueTimeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
const TIME_NEEDS_DATE = "Une heure demande un jour d'échéance.";

export const listTasksInputSchema = listTargetSchema;

export const createTaskInputSchema = z
  .strictObject({
    listId: listIdSchema,
    /** Tâche de la même liste dont celle-ci devient une sous-tâche ; absente : tâche de la liste. */
    parentId: taskIdSchema.optional(),
    title: titleSchema,
    description: descriptionSchema.optional(),
    dueDate: dueDateSchema.optional(),
    /** Heure de l'échéance ; exige `dueDate`. Absente : sans heure. */
    dueTime: dueTimeSchema.optional(),
    recurrence: recurrenceSchema.optional(),
    /** Membre de l'Espace de la liste ; absent : personne, jamais imposé. */
    assigneeId: userIdSchema.optional(),
  })
  .refine(({ dueDate, dueTime }) => dueTime === undefined || dueDate !== undefined, {
    message: TIME_NEEDS_DATE,
    path: ["dueTime"],
  });

/**
 * Champs modifiés : au moins un ; `null` efface. `version` lue avec la tâche (concurrence optimiste). Effacer le jour
 * efface l'heure avec lui ; poser une heure sans jour (ni dans la demande, ni sur la tâche) est refusé.
 */
export const updateTaskInputSchema = z
  .strictObject({
    taskId: taskIdSchema,
    version: z.int().min(1),
    title: titleSchema.optional(),
    description: descriptionSchema.nullable().optional(),
    dueDate: dueDateSchema.nullable().optional(),
    dueTime: dueTimeSchema.nullable().optional(),
    recurrence: recurrenceSchema.nullable().optional(),
    assigneeId: userIdSchema.nullable().optional(),
  })
  .refine(
    ({ title, description, dueDate, dueTime, recurrence, assigneeId }) =>
      [title, description, dueDate, dueTime, recurrence, assigneeId].some(
        (field) => field !== undefined,
      ),
    "Aucun champ à modifier.",
  )
  .refine(({ dueDate, dueTime }) => dueDate !== null || dueTime === undefined || dueTime === null, {
    message: TIME_NEEDS_DATE,
    path: ["dueTime"],
  });

/** Cocher ou décocher : un état demandé, pas une bascule, donc rejouable sans effet de bord. */
export const setTaskDoneInputSchema = taskTargetSchema.extend({ done: z.boolean() });

/**
 * Cocher une tâche répétée : l'occurrence est faite, l'échéance passe à la suivante (ADR 0017). `today` : jour de
 * l'appareil (le serveur ne connaît pas le fuseau de l'utilisateur). `version` : rejouer la même coche ne fait pas
 * avancer deux fois.
 */
export const completeOccurrenceInputSchema = taskTargetSchema.extend({
  version: z.int().min(1),
  today: dueDateSchema,
});

/** Terminer pour de bon une tâche répétée : la répétition s'arrête et la tâche est cochée, en une écriture. */
export const finishTaskInputSchema = taskTargetSchema.extend({ version: z.int().min(1) });

/**
 * Annuler une coche de tâche répétée (occurrence faite ou « terminer ») : échéance et règle d'avant, tâche à faire.
 * `version` : celle rendue par la coche ; modifiée depuis ⇒ STALE_VERSION, rien n'est écrasé.
 */
export const undoCompletionInputSchema = taskTargetSchema.extend({
  version: z.int().min(1),
  dueDate: dueDateSchema.nullable(),
  recurrence: recurrenceSchema,
});

export const deleteTaskInputSchema = taskTargetSchema;

export const taskSchema = z.strictObject({
  id: taskIdSchema,
  listId: listIdSchema,
  /** null : tâche de la liste ; sinon, sous-tâche de cette tâche (un seul niveau). */
  parentId: taskIdSchema.nullable(),
  title: z.string(),
  description: z.string().nullable(),
  dueDate: dueDateSchema.nullable(),
  /** `HH:MM` ; null : sans heure (toujours null sans `dueDate`). */
  dueTime: dueTimeSchema.nullable(),
  /** null : à faire. Une tâche répétée reste à faire : la cocher avance son échéance. */
  completedAt: z.date().nullable(),
  /** Qui l'a cochée (« Cochée par ») ; null : à faire, ou compte supprimé depuis. */
  completedBy: personSchema.nullable(),
  /** Qui s'en occupe ; null : personne, ou plus membre de l'Espace de la liste. */
  assignee: personSchema.nullable(),
  /** null : tâche non répétée. */
  recurrence: recurrenceSchema.nullable(),
  version: z.int(),
});

/** Liste vue depuis une tâche : de quoi la nommer et la teinter. */
const listRefSchema = z.strictObject({
  id: listIdSchema,
  name: z.string(),
  tint: z.enum(LIST_TINTS),
});

export const getTaskInputSchema = taskTargetSchema;

/**
 * Une tâche pour son détail : la tâche, sa liste (nom, teinte, droit d'écriture de l'appelant) et ses sous-tâches par
 * ordre de création. Une sous-tâche n'a pas de sous-tâches (un seul niveau).
 */
export const getTaskOutputSchema = z.strictObject({
  task: taskSchema,
  list: listRefSchema.extend({
    /** Modifier la tâche : faux pour une liste montrée en lecture seule. */
    canWrite: z.boolean(),
    /** Liste partagée avec un Espace (assignation possible) ; faux : liste perso. */
    shared: z.boolean(),
  }),
  subtasks: z.array(taskSchema).max(TODO_LIST_MAX_TASKS),
});

/** Jour de l'appareil (`AAAA-MM-JJ`) : le serveur ne connaît pas le fuseau de l'utilisateur. */
export const todayTasksInputSchema = z.strictObject({ date: dueDateSchema });

/** Tâche de l'écran Aujourd'hui, avec la liste où elle est (pastille). */
const todayTaskSchema = taskSchema.extend({
  list: listRefSchema,
});

/** Une section : les premières tâches (bornées) et leur nombre total. */
const todaySectionSchema = z.strictObject({
  items: z.array(todayTaskSchema).max(TODAY_SECTION_MAX),
  total: z.int().min(0),
});

/**
 * Tâches à faire de l'appelant : celles de ses listes perso, et celles qui lui sont assignées dans une liste partagée.
 * Cochées et sous-tâches exclues.
 */
export const todayTasksOutputSchema = z.strictObject({
  /** Échéance aujourd'hui, par heure puis par ordre de création. */
  dueToday: todaySectionSchema,
  /** Sans échéance. */
  ongoing: todaySectionSchema,
  /** Échéance passée, la plus ancienne d'abord. */
  overdue: todaySectionSchema,
});

/**
 * Reporter des tâches à un jour (« Les reporter à aujourd'hui »), au geste de l'utilisateur seulement. Chaque tâche
 * porte sa `version` lue : une seule périmée et rien n'est écrit. Une tâche répétée se reporte aussi : son échéance
 * change, sa série repart de là (comme une modification de l'échéance).
 */
export const postponeTasksInputSchema = z.strictObject({
  date: dueDateSchema,
  /** Nouvel horaire du jour de report, pour toutes les tâches du lot ; absent : sans heure. */
  time: dueTimeSchema.optional(),
  tasks: z
    .array(z.strictObject({ taskId: taskIdSchema, version: z.int().min(1) }))
    .min(1)
    .max(TODAY_SECTION_MAX)
    .refine((tasks) => new Set(tasks.map(({ taskId }) => taskId)).size === tasks.length, {
      message: "Une tâche n'est reportée qu'une fois.",
    }),
});

/** Toutes les tâches de la liste (bornées), sous-tâches comprises, par ordre de création. */
export const listTasksOutputSchema = z.strictObject({
  items: z.array(taskSchema).max(TODO_LIST_MAX_TASKS),
});

/** Les tâches reportées, à jour (échéance au jour demandé, à l'heure demandée ou sans heure). */
export const postponeTasksOutputSchema = z.strictObject({
  items: z.array(taskSchema).max(TODAY_SECTION_MAX),
});

export type TaskOutput = z.infer<typeof taskSchema>;
export type GetTaskOutput = z.infer<typeof getTaskOutputSchema>;
export type PostponeTasksInput = z.output<typeof postponeTasksInputSchema>;
export type TodayTasksOutput = z.infer<typeof todayTasksOutputSchema>;
export type TodayTaskOutput = z.infer<typeof todayTaskSchema>;
export type ListTasksOutput = z.infer<typeof listTasksOutputSchema>;
export type CreateTaskInput = z.output<typeof createTaskInputSchema>;
export type UpdateTaskInput = z.output<typeof updateTaskInputSchema>;
export type SetTaskDoneInput = z.output<typeof setTaskDoneInputSchema>;
export type CompleteOccurrenceInput = z.output<typeof completeOccurrenceInputSchema>;
export type FinishTaskInput = z.output<typeof finishTaskInputSchema>;
export type UndoCompletionInput = z.output<typeof undoCompletionInputSchema>;
