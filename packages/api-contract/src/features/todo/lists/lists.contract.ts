import { oc } from "@orpc/contract";

import { emptyOutputSchema } from "../../_shared/empty.schemas";
import { TODO_ERRORS } from "../todo.schemas";
import {
  createListInputSchema,
  deleteListInputSchema,
  listListsInputSchema,
  listListsOutputSchema,
  listMembersInputSchema,
  listMembersOutputSchema,
  todoListSchema,
  updateListInputSchema,
} from "./lists.schemas";

// Une liste dont l'appelant n'a pas le droit de lecture n'existe pas pour lui : NOT_FOUND.
export const listsContract = {
  list: oc
    .route({
      summary: "Mes listes",
      description:
        "Listes de l'appelant et listes partagées de ses Espaces, de la plus ancienne à la plus récente.",
    })
    .input(listListsInputSchema)
    .output(listListsOutputSchema),
  create: oc
    .route({
      summary: "Créer une liste",
      description:
        "Liste perso, ou partagée avec un Espace (`spaceId`). Nombre de listes au plus atteint : CONFLICT `TOO_MANY_LISTS` ; Todo non activé dans l'Espace : CONFLICT `TODO_DISABLED`.",
    })
    .errors(TODO_ERRORS)
    .input(createListInputSchema)
    .output(todoListSchema),
  update: oc
    .route({
      summary: "Modifier une liste",
      description:
        "Nom, teinte ; Espace (propriétaire seulement, sinon FORBIDDEN). `version` périmée : CONFLICT `STALE_VERSION` ; Todo non activé dans l'Espace : CONFLICT `TODO_DISABLED`.",
    })
    .errors(TODO_ERRORS)
    .input(updateListInputSchema)
    .output(todoListSchema),
  members: oc
    .route({
      summary: "Personnes d'une liste",
      description: "Liste perso : son propriétaire. Liste partagée : les membres de son Espace.",
    })
    .input(listMembersInputSchema)
    .output(listMembersOutputSchema),
  delete: oc
    .route({
      summary: "Supprimer une liste",
      description:
        "Ses tâches sont supprimées avec elle. Son propriétaire, ou un propriétaire de son Espace, sinon FORBIDDEN.",
    })
    .input(deleteListInputSchema)
    .output(emptyOutputSchema),
};
