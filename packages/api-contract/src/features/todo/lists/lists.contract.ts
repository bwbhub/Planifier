import { oc } from "@orpc/contract";

import { emptyOutputSchema } from "../../_shared/empty.schemas";
import { TODO_ERRORS } from "../todo.schemas";
import {
  createListInputSchema,
  deleteListInputSchema,
  listListsInputSchema,
  listListsOutputSchema,
  todoListSchema,
  updateListInputSchema,
} from "./lists.schemas";

// Une liste dont l'appelant n'a pas le droit de lecture n'existe pas pour lui : NOT_FOUND.
export const listsContract = {
  list: oc
    .route({
      summary: "Mes listes",
      description: "Listes de l'appelant, de la plus ancienne à la plus récente.",
    })
    .input(listListsInputSchema)
    .output(listListsOutputSchema),
  create: oc
    .route({
      summary: "Créer une liste",
      description:
        "Liste perso, privée. Nombre de listes au plus atteint : CONFLICT `TOO_MANY_LISTS`.",
    })
    .errors(TODO_ERRORS)
    .input(createListInputSchema)
    .output(todoListSchema),
  update: oc
    .route({
      summary: "Modifier une liste",
      description: "Nom, teinte. `version` périmée : CONFLICT `STALE_VERSION`.",
    })
    .errors(TODO_ERRORS)
    .input(updateListInputSchema)
    .output(todoListSchema),
  delete: oc
    .route({ summary: "Supprimer une liste", description: "Ses tâches sont supprimées avec elle." })
    .input(deleteListInputSchema)
    .output(emptyOutputSchema),
};
