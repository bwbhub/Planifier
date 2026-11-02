import { SPACE_MAX_MEMBERS } from "@planifier/constants/spaces";
import { LIST_TINTS, TODO_LIST_NAME_MAX_LENGTH, TODO_MAX_LISTS } from "@planifier/constants/todo";
import { z } from "zod";

import { PAGE_MAX_LIMIT } from "../../_shared/page.schemas";
import {
  listIdSchema,
  listTargetSchema,
  personSchema,
  spaceIdSchema,
  userIdSchema,
} from "../todo.schemas";

const listNameSchema = z.string().trim().min(1).max(TODO_LIST_NAME_MAX_LENGTH);
const tintSchema = z.enum(LIST_TINTS);

/**
 * Mes listes et celles que mes Espaces partagent ou voient en lecture seule. Chacun a au plus `TODO_MAX_LISTS` listes, mais le nombre
 * d'Espaces, et donc de listes visibles, n'est pas borné : d'où les pages.
 */
export const listListsInputSchema = z.strictObject({
  limit: z.int().min(1).max(PAGE_MAX_LIMIT).default(TODO_MAX_LISTS),
  /** `nextCursor` de la page précédente. */
  cursor: listIdSchema.optional(),
});

const ONE_SHARING_ERROR = "Une liste n'a qu'un partage à la fois.";

/** Partage d'une liste : ses deux formes s'excluent. */
function hasOneSharing({
  spaceId,
  readOnlySpaceId,
}: {
  spaceId?: string | null | undefined;
  readOnlySpaceId?: string | null | undefined;
}) {
  return (spaceId ?? null) === null || (readOnlySpaceId ?? null) === null;
}

export const createListInputSchema = z
  .strictObject({
    name: listNameSchema,
    tint: tintSchema,
    /** Liste partagée avec cet Espace (l'appelant en est membre, Todo y est activé). Absent : liste perso. */
    spaceId: spaceIdSchema.optional(),
    /** Liste perso montrée à cet Espace, en lecture seule (mêmes conditions). */
    readOnlySpaceId: spaceIdSchema.optional(),
  })
  .refine(hasOneSharing, ONE_SHARING_ERROR);

/**
 * Réglages modifiés : au moins un ; `version` lue avec la liste (concurrence optimiste). Propriétaire seulement :
 * `spaceId` rattache la liste à un Espace, `null` la rend perso ; `readOnlySpaceId` la rend perso et la montre à un
 * Espace, `null` cesse de la montrer. Choisir un partage retire l'autre.
 */
export const updateListInputSchema = z
  .strictObject({
    listId: listIdSchema,
    version: z.int().min(1),
    name: listNameSchema.optional(),
    tint: tintSchema.optional(),
    spaceId: spaceIdSchema.nullable().optional(),
    readOnlySpaceId: spaceIdSchema.nullable().optional(),
  })
  .refine(
    ({ name, tint, spaceId, readOnlySpaceId }) =>
      name !== undefined ||
      tint !== undefined ||
      spaceId !== undefined ||
      readOnlySpaceId !== undefined,
    "Aucun réglage à modifier.",
  )
  .refine(hasOneSharing, ONE_SHARING_ERROR);

export const deleteListInputSchema = listTargetSchema;

const listSpaceSchema = z.strictObject({ id: spaceIdSchema, name: z.string() });

export const todoListSchema = z.strictObject({
  id: listIdSchema,
  name: z.string(),
  tint: tintSchema,
  version: z.int(),
  /** Tâches non cochées, sous-tâches non comprises. */
  openTaskCount: z.int(),
  /** Espace avec lequel la liste est partagée ; null : liste perso. */
  space: listSpaceSchema.nullable(),
  /** Espace qui voit la liste perso en lecture seule ; null : privée, ou liste partagée. */
  readOnlySpace: listSpaceSchema.nullable(),
  /** Droits de l'appelant, au-delà de la lecture. */
  can: z.strictObject({
    /** Modifier la liste et ses tâches : tout membre d'une liste partagée ; liste perso, son propriétaire seul. */
    write: z.boolean(),
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

/** Personnes de la liste : liste perso, même montrée à un Espace, son propriétaire ; liste partagée, les membres. */
export const listMembersOutputSchema = z.strictObject({
  items: z.array(personSchema).max(SPACE_MAX_MEMBERS + 1),
  /** L'appelant, pour distinguer ce qui lui est assigné. */
  callerId: userIdSchema,
});

export type TodoListOutput = z.infer<typeof todoListSchema>;
export type ListListsOutput = z.infer<typeof listListsOutputSchema>;
export type ListListsInput = z.output<typeof listListsInputSchema>;
export type ListMembersOutput = z.infer<typeof listMembersOutputSchema>;
export type CreateListInput = z.output<typeof createListInputSchema>;
export type UpdateListInput = z.output<typeof updateListInputSchema>;
