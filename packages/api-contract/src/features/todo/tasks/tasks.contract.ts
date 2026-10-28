import { oc } from "@orpc/contract";

import { emptyOutputSchema } from "../../_shared/empty.schemas";
import { TODO_ERRORS } from "../todo.schemas";
import {
  createTaskInputSchema,
  deleteTaskInputSchema,
  listTasksInputSchema,
  listTasksOutputSchema,
  setTaskDoneInputSchema,
  taskSchema,
  updateTaskInputSchema,
} from "./tasks.schemas";

// Une tâche se voit et se modifie selon les droits sur sa liste ; sans lecture : NOT_FOUND.
export const tasksContract = {
  list: oc
    .route({ summary: "Tâches d'une liste", description: "Par ordre de création." })
    .input(listTasksInputSchema)
    .output(listTasksOutputSchema),
  create: oc
    .route({
      summary: "Créer une tâche",
      description:
        "Titre obligatoire. `parentId` : sous-tâche d'une tâche de la même liste (sinon NOT_FOUND), un seul niveau (CONFLICT `NESTED_SUBTASK`). Liste pleine (sous-tâches comprises) : CONFLICT `LIST_FULL`.",
    })
    .errors(TODO_ERRORS)
    .input(createTaskInputSchema)
    .output(taskSchema),
  update: oc
    .route({
      summary: "Modifier une tâche",
      description:
        "Titre, description, échéance (`null` efface). `version` périmée : CONFLICT `STALE_VERSION`.",
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
  delete: oc
    .route({
      summary: "Supprimer une tâche",
      description: "Ses sous-tâches sont supprimées avec elle.",
    })
    .input(deleteTaskInputSchema)
    .output(emptyOutputSchema),
};
