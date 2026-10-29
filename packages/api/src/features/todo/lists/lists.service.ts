import { ORPCError } from "@orpc/server";
import type {
  CreateListInput,
  ListListsInput,
  ListListsOutput,
  ListMembersOutput,
  TodoListOutput,
  UpdateListInput,
} from "@planifier/api-contract";
import { canAccessTodoList, sharingSpaceVerdict } from "@planifier/domain-access/todo-list";
import { isListTint, TODO_MAX_LISTS } from "@planifier/constants/todo";
import type { Db, DbTransaction, Prisma } from "@planifier/db";

import { listAccessSelect, toListAccess, toPerson } from "../list-access";
import { todoConflict } from "../todo-errors";

function listSelect(userId: string) {
  return {
    ...listAccessSelect(userId),
    id: true,
    name: true,
    tint: true,
    version: true,
    _count: { select: { tasks: { where: { completedAt: null, parentId: null } } } },
  } as const satisfies Prisma.TodoListSelect;
}

type ListRow = Prisma.TodoListGetPayload<{ select: ReturnType<typeof listSelect> }>;

function toListOutput(userId: string, row: ListRow): TodoListOutput {
  const { id, name, tint, version, space, _count } = row;
  // Chaîne libre en base : une valeur inconnue est une donnée corrompue, pas une entrée à deviner.
  if (!isListTint(tint)) throw new Error(`Teinte de liste inconnue en base (liste ${id}).`);
  const access = toListAccess(userId, row);
  return {
    id,
    name,
    tint,
    version,
    openTaskCount: _count.tasks,
    space: space === null ? null : { id: space.id, name: space.name },
    can: {
      delete: canAccessTodoList(access, "delete"),
      share: canAccessTodoList(access, "share"),
    },
  };
}

/**
 * Listes visibles (`canAccessTodoList`) : ses listes perso, et les listes partagées des Espaces dont l'appelant est
 * membre. Celles d'un Espace qu'il a quitté restent à l'Espace, même s'il les a créées.
 */
function visibleTo(userId: string): Prisma.TodoListWhereInput {
  return {
    OR: [{ ownerId: userId, spaceId: null }, { space: { members: { some: { userId } } } }],
  };
}

/** Curseur : identifiant de liste (`uuid(7)`, croissant), donc ordre de création. */
export async function listLists(
  db: Db,
  userId: string,
  { limit, cursor }: ListListsInput,
): Promise<ListListsOutput> {
  const rows = await db.todoList.findMany({
    where: { ...visibleTo(userId), ...(cursor === undefined ? {} : { id: { gt: cursor } }) },
    orderBy: { id: "asc" },
    take: limit + 1,
    select: listSelect(userId),
  });
  const page = rows.slice(0, limit);
  return {
    items: page.map((row) => toListOutput(userId, row)),
    nextCursor: rows.length > limit ? (page.at(-1)?.id ?? null) : null,
  };
}

/** Espace où partager une liste : droit décidé par `sharingSpaceVerdict` (membre, Todo activé). */
async function assertSharingSpace(tx: DbTransaction, userId: string, spaceId: string) {
  const space = await tx.space.findUnique({
    where: { id: spaceId },
    select: { modules: true, members: { where: { userId }, select: { role: true } } },
  });
  const verdict = sharingSpaceVerdict(
    space === null ? null : { callerRole: space.members[0]?.role ?? null, modules: space.modules },
  );
  if (verdict === "NOT_FOUND") throw new ORPCError("NOT_FOUND");
  if (verdict === "TODO_DISABLED") throw todoConflict("TODO_DISABLED");
}

/** Sous le verrou de la ligne de l'utilisateur : deux créations simultanées ne dépassent pas la borne. */
export async function createList(
  db: Db,
  userId: string,
  { spaceId, ...input }: CreateListInput,
): Promise<TodoListOutput> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM users WHERE id = ${userId} FOR UPDATE`;
    // Ses listes encore à lui : laissées à un Espace quitté, elles ne comptent plus.
    const count = await tx.todoList.count({ where: { ownerId: userId, ...visibleTo(userId) } });
    if (count >= TODO_MAX_LISTS) throw todoConflict("TOO_MANY_LISTS");
    if (spaceId !== undefined) await assertSharingSpace(tx, userId, spaceId);
    const list = await tx.todoList.create({
      data: { ...input, ownerId: userId, spaceId: spaceId ?? null },
      select: listSelect(userId),
    });
    return toListOutput(userId, list);
  });
}

/** Changer d'Espace demande le droit `share`, vérifié par la garde ; l'Espace visé l'est ici. */
export async function updateList(
  db: Db,
  userId: string,
  { listId, version, name, tint, spaceId }: UpdateListInput,
): Promise<TodoListOutput> {
  return db.$transaction(async (tx) => {
    if (spaceId !== undefined && spaceId !== null) await assertSharingSpace(tx, userId, spaceId);
    const { count } = await tx.todoList.updateMany({
      where: { id: listId, version },
      // Champ absent : inchangé (Prisma refuse `undefined` explicite avec `exactOptionalPropertyTypes`).
      data: {
        ...(name === undefined ? {} : { name }),
        ...(tint === undefined ? {} : { tint }),
        ...(spaceId === undefined ? {} : { spaceId }),
        version: { increment: 1 },
      },
    });
    const list = await tx.todoList.findUnique({
      where: { id: listId },
      select: listSelect(userId),
    });
    // Supprimée entre la garde et l'écriture : elle n'existe plus, ce n'est pas une version périmée.
    if (list === null) throw new ORPCError("NOT_FOUND");
    if (count === 0) throw todoConflict("STALE_VERSION");
    return toListOutput(userId, list);
  });
}

/**
 * Liste perso : son propriétaire. Liste partagée : les membres de son Espace, son créateur d'abord s'il en est
 * encore membre, puis par ordre d'arrivée.
 */
export async function listMembers(db: Db, listId: string): Promise<ListMembersOutput> {
  const list = await db.todoList.findUnique({
    where: { id: listId },
    select: {
      owner: { select: { id: true, name: true } },
      space: {
        select: {
          members: {
            orderBy: { id: "asc" },
            select: { user: { select: { id: true, name: true } } },
          },
        },
      },
    },
  });
  // Supprimée entre la garde et la lecture.
  if (list === null) throw new ORPCError("NOT_FOUND");
  if (list.space === null) return { items: [toPerson(list.owner)] };
  const members = list.space.members.map(({ user }) => user);
  const creatorFirst = [
    ...members.filter(({ id }) => id === list.owner.id),
    ...members.filter(({ id }) => id !== list.owner.id),
  ];
  return { items: creatorFirst.map(toPerson) };
}

/** Ses tâches partent avec elle (`onDelete: Cascade`). */
export async function deleteList(db: Db, listId: string): Promise<void> {
  await db.todoList.deleteMany({ where: { id: listId } });
}
