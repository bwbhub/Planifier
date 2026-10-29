import { ORPCError } from "@orpc/server";
import type {
  CreateListInput,
  ListListsOutput,
  TodoListOutput,
  UpdateListInput,
} from "@planifier/api-contract";
import { isListTint, TODO_MAX_LISTS } from "@planifier/constants/todo";
import type { Db, Prisma } from "@planifier/db";

import { todoConflict } from "../todo-errors";

const LIST_SELECT = {
  id: true,
  name: true,
  tint: true,
  version: true,
  _count: { select: { tasks: { where: { completedAt: null } } } },
} as const satisfies Prisma.TodoListSelect;

type ListRow = Prisma.TodoListGetPayload<{ select: typeof LIST_SELECT }>;

function toListOutput({ _count, tint, ...list }: ListRow): TodoListOutput {
  // Chaîne libre en base : une valeur inconnue est une donnée corrompue, pas une entrée à deviner.
  if (!isListTint(tint)) throw new Error(`Teinte de liste inconnue en base (liste ${list.id}).`);
  return { ...list, tint, openTaskCount: _count.tasks };
}

/** Curseur inutile : les listes d'un utilisateur sont bornées (`TODO_MAX_LISTS`). */
export async function listLists(db: Db, userId: string): Promise<ListListsOutput> {
  const rows = await db.todoList.findMany({
    where: { ownerId: userId },
    orderBy: { id: "asc" },
    take: TODO_MAX_LISTS,
    select: LIST_SELECT,
  });
  return { items: rows.map(toListOutput) };
}

/** Sous le verrou de la ligne de l'utilisateur : deux créations simultanées ne dépassent pas la borne. */
export async function createList(
  db: Db,
  userId: string,
  input: CreateListInput,
): Promise<TodoListOutput> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM users WHERE id = ${userId} FOR UPDATE`;
    const count = await tx.todoList.count({ where: { ownerId: userId } });
    if (count >= TODO_MAX_LISTS) throw todoConflict("TOO_MANY_LISTS");
    const list = await tx.todoList.create({
      data: { ...input, ownerId: userId },
      select: LIST_SELECT,
    });
    return toListOutput(list);
  });
}

export async function updateList(
  db: Db,
  { listId, version, name, tint }: UpdateListInput,
): Promise<TodoListOutput> {
  const { count } = await db.todoList.updateMany({
    where: { id: listId, version },
    // Champ absent : inchangé (Prisma refuse `undefined` explicite avec `exactOptionalPropertyTypes`).
    data: {
      ...(name === undefined ? {} : { name }),
      ...(tint === undefined ? {} : { tint }),
      version: { increment: 1 },
    },
  });
  const list = await db.todoList.findUnique({ where: { id: listId }, select: LIST_SELECT });
  // Supprimée entre la garde et l'écriture : elle n'existe plus, ce n'est pas une version périmée.
  if (list === null) throw new ORPCError("NOT_FOUND");
  if (count === 0) throw todoConflict("STALE_VERSION");
  return toListOutput(list);
}

/** Ses tâches partent avec elle (`onDelete: Cascade`). */
export async function deleteList(db: Db, listId: string): Promise<void> {
  await db.todoList.deleteMany({ where: { id: listId } });
}
