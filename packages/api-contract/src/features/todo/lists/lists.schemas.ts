import { SPACE_MAX_MEMBERS } from "@planifier/constants/spaces";
import { LIST_TINTS, TODO_LIST_NAME_MAX_LENGTH, TODO_MAX_LISTS } from "@planifier/constants/todo";
import { z } from "zod";

import { PAGE_MAX_LIMIT } from "../../_shared/page.schemas";
import { listIdSchema, listTargetSchema, personSchema, spaceIdSchema } from "../todo.schemas";

const listNameSchema = z.string().trim().min(1).max(TODO_LIST_NAME_MAX_LENGTH);
const tintSchema = z.enum(LIST_TINTS);

/**
 * Mes listes et les listes partagées de mes Espaces. Chacun a au plus `TODO_MAX_LISTS` listes, mais le nombre
 * d'Espaces, et donc de listes visibles, n'est pas borné : d'où les pages.
 */
export const listListsInputSchema = z.strictObject({
  limit: z.int().min(1).max(PAGE_MAX_LIMIT).default(TODO_MAX_LISTS),
  /** `nextCursor` de la page précédente. */
  cursor: listIdSchema.optional(),
});

export const createListInputSchema = z.strictObject({
  name: listNameSchema,
  tint: tintSchema,
  /** Liste partagée avec cet Espace (l'appelant en est membre, Todo y est activé). Absent : liste perso. */
  spaceId: spaceIdSchema.optional(),
});

/**
 * Réglages modifiés : au moins un ; `version` lue avec la liste (concurrence optimiste). `spaceId` (propriétaire
 * seulement) : rattacher la liste à un Espace ; `null` la rend perso.
 */
export const updateListInputSchema = z
  .strictObject({
    listId: listIdSchema,
    version: z.int().min(1),
    name: listNameSchema.optional(),
    tint: tintSchema.optional(),
    spaceId: spaceIdSchema.nullable().optional(),
  })
  .refine(
    ({ name, tint, spaceId }) => name !== undefined || tint !== undefined || spaceId !== undefined,
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
  /** Espace avec lequel la liste est partagée ; null : liste perso. */
  space: z.strictObject({ id: spaceIdSchema, name: z.string() }).nullable(),
  /** Droits de l'appelant au-delà de l'écriture, ouverte à quiconque voit la liste. */
  can: z.strictObject({
    /** Supprimer la liste : son propriétaire, ou un propriétaire de son Espace. */
    delete: z.boolean(),
    /** Changer d'Espace ou la rendre perso : son propriétaire seulement. */
    share: z.boolean(),
  }),
});

/** Listes visibles par l'appelant, de la plus ancienne à la plus récente. */
export const listListsOutputSchema = z.strictObject({
  items: z.array(todoListSchema).max(PAGE_MAX_LIMIT),
  /** null : dernière page. */
  nextCursor: listIdSchema.nullable(),
});

export const listMembersInputSchema = listTargetSchema;

/** Personnes qui ont accès à la liste : son propriétaire et, liste partagée, les membres de son Espace. */
export const listMembersOutputSchema = z.strictObject({
  items: z.array(personSchema).max(SPACE_MAX_MEMBERS + 1),
});

export type TodoListOutput = z.infer<typeof todoListSchema>;
export type ListListsOutput = z.infer<typeof listListsOutputSchema>;
export type ListListsInput = z.output<typeof listListsInputSchema>;
export type ListMembersOutput = z.infer<typeof listMembersOutputSchema>;
export type CreateListInput = z.output<typeof createListInputSchema>;
export type UpdateListInput = z.output<typeof updateListInputSchema>;
