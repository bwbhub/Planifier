import { LIST_TINTS, TODO_LIST_NAME_MAX_LENGTH, TODO_MAX_LISTS } from "@planifier/constants/todo";
import { z } from "zod";

import { listIdSchema, listTargetSchema } from "../todo.schemas";

const listNameSchema = z.string().trim().min(1).max(TODO_LIST_NAME_MAX_LENGTH);
const tintSchema = z.enum(LIST_TINTS);

export const listListsInputSchema = z.strictObject({});

export const createListInputSchema = z.strictObject({
  name: listNameSchema,
  tint: tintSchema,
});

/** Réglages modifiés : au moins un ; `version` lue avec la liste (concurrence optimiste). */
export const updateListInputSchema = z
  .strictObject({
    listId: listIdSchema,
    version: z.int().min(1),
    name: listNameSchema.optional(),
    tint: tintSchema.optional(),
  })
  .refine(
    ({ name, tint }) => name !== undefined || tint !== undefined,
    "Aucun réglage à modifier.",
  );

export const deleteListInputSchema = listTargetSchema;

export const todoListSchema = z.strictObject({
  id: listIdSchema,
  name: z.string(),
  tint: tintSchema,
  version: z.int(),
  /** Tâches non cochées, sous-tâches non comprises. */
  openTaskCount: z.int(),
});

/** Toutes les listes de l'appelant (bornées), de la plus ancienne à la plus récente. */
export const listListsOutputSchema = z.strictObject({
  items: z.array(todoListSchema).max(TODO_MAX_LISTS),
});

export type TodoListOutput = z.infer<typeof todoListSchema>;
export type ListListsOutput = z.infer<typeof listListsOutputSchema>;
export type CreateListInput = z.output<typeof createListInputSchema>;
export type UpdateListInput = z.output<typeof updateListInputSchema>;
