import { oc } from "@orpc/contract";

import { emptyOutputSchema } from "../../_shared/empty.schemas";
import { TODO_ERRORS } from "../todo.schemas";
import {
  completeOccurrenceInputSchema,
  createTaskInputSchema,
  deleteTaskInputSchema,
  finishTaskInputSchema,
  listTasksInputSchema,
  listTasksOutputSchema,
  postponeTasksInputSchema,
  postponeTasksOutputSchema,
  setTaskDoneInputSchema,
  taskSchema,
  todayTasksInputSchema,
  todayTasksOutputSchema,
  undoCompletionInputSchema,
  updateTaskInputSchema,
} from "./tasks.schemas";

// Une tâche se voit et se modifie selon les droits sur sa liste ; sans lecture : NOT_FOUND.
export const tasksContract = {
  postpone: oc
    .route({
      summary: "Reporter des tâches",
      description:
        "Met l'échéance des tâches au jour `date` et retire leur heure ; au geste de l'utilisateur seulement. Droit d'écriture sur chaque liste, sinon NOT_FOUND ou FORBIDDEN. Une `version` périmée : CONFLICT `STALE_VERSION`, rien n'est écrit. Une tâche répétée : CONFLICT `RECURRING_TASK`, rien n'est écrit.",
    })
    .errors(TODO_ERRORS)
    .input(postponeTasksInputSchema)
    .output(postponeTasksOutputSchema),
  today: oc
    .route({
      summary: "Mes tâches du jour",
      description:
        "Tâches à faire de l'appelant : celles de ses listes perso et celles qui lui sont assignées dans une liste partagée (jamais les listes montrées en lecture seule). Trois sections bornées : échéance aujourd'hui, sans échéance, en retard ; `total` dit le reste. `date` : le jour de l'appareil.",
    })
    .input(todayTasksInputSchema)
    .output(todayTasksOutputSchema),
  list: oc
    .route({ summary: "Tâches d'une liste", description: "Par ordre de création." })
    .input(listTasksInputSchema)
    .output(listTasksOutputSchema),
  create: oc
    .route({
      summary: "Créer une tâche",
      description:
        "Titre obligatoire. `parentId` : sous-tâche d'une tâche de la même liste (sinon NOT_FOUND), un seul niveau (CONFLICT `NESTED_SUBTASK`). Liste pleine (sous-tâches comprises) : CONFLICT `LIST_FULL`. `assigneeId` hors de l'Espace de la liste : CONFLICT `ASSIGNEE_NOT_MEMBER`.",
    })
    .errors(TODO_ERRORS)
    .input(createTaskInputSchema)
    .output(taskSchema),
  update: oc
    .route({
      summary: "Modifier une tâche",
      description:
        "Titre, description, échéance, assigné (`null` efface). `version` périmée : CONFLICT `STALE_VERSION`. `assigneeId` hors de l'Espace de la liste : CONFLICT `ASSIGNEE_NOT_MEMBER`.",
    })
    .errors(TODO_ERRORS)
    .input(updateTaskInputSchema)
    .output(taskSchema),
  setDone: oc
    .route({
      summary: "Cocher ou décocher une tâche",
      description: "État demandé explicitement par l'utilisateur ; rejouable.",
    })
    .input(setTaskDoneInputSchema)
    .output(taskSchema),
  completeOccurrence: oc
    .route({
      summary: "Cocher une tâche répétée",
      description:
        "L'occurrence est faite : l'échéance passe à la première occurrence après `today`, la tâche reste à faire. Tâche non répétée : CONFLICT `NOT_RECURRING` ; `version` périmée : CONFLICT `STALE_VERSION`.",
    })
    .errors(TODO_ERRORS)
    .input(completeOccurrenceInputSchema)
    .output(taskSchema),
  finish: oc
    .route({
      summary: "Terminer pour de bon une tâche répétée",
      description:
        "La répétition s'arrête et la tâche est cochée, en une écriture. `version` périmée : CONFLICT `STALE_VERSION`.",
    })
    .errors(TODO_ERRORS)
    .input(finishTaskInputSchema)
    .output(taskSchema),
  undoCompletion: oc
    .route({
      summary: "Annuler la coche d'une tâche répétée",
      description:
        "Rend l'échéance et la règle d'avant la coche (occurrence faite ou « terminer »), tâche à faire. `version` : celle rendue par la coche ; modifiée depuis : CONFLICT `STALE_VERSION`.",
    })
    .errors(TODO_ERRORS)
    .input(undoCompletionInputSchema)
    .output(taskSchema),
  delete: oc
    .route({
      summary: "Supprimer une tâche",
      description: "Ses sous-tâches sont supprimées avec elle.",
    })
    .input(deleteTaskInputSchema)
    .output(emptyOutputSchema),
};
