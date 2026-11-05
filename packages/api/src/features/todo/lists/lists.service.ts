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

import { lockSpace } from "../../spaces/space-lock";
import { listAccessSelect, toListAccess, toPerson } from "../../_shared/list-access";
import { toPage } from "../../_shared/page";
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
  const { id, name, tint, version, space, readOnlySpace, _count } = row;
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
    readOnlySpace:
      readOnlySpace === null ? null : { id: readOnlySpace.id, name: readOnlySpace.name },
    can: {
      write: canAccessTodoList(access, "write"),
      delete: canAccessTodoList(access, "delete"),
      share: canAccessTodoList(access, "share"),
    },
  };
}

/**
 * Listes visibles (`canAccessTodoList`) : ses listes perso, et celles que les Espaces dont l'appelant est membre
 * partagent ou voient en lecture seule. Celles d'un Espace qu'il a quitté restent à l'Espace, même s'il les a créées.
 */
function visibleTo(userId: string): Prisma.TodoListWhereInput {
  return {
    OR: [
      { ownerId: userId, spaceId: null },
      { space: { members: { some: { userId } } } },
      { readOnlySpace: { members: { some: { userId } } } },
    ],
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
  return toPage(rows, limit, (row) => toListOutput(userId, row));
}

/**
 * Espace où partager une liste : droit décidé par `sharingSpaceVerdict` (membre, Todo activé). Sous le verrou de
 * l'Espace : une sortie simultanée voit le partage et le retire, il ne survit pas à un départ.
 */
async function assertSharingSpace(tx: DbTransaction, userId: string, spaceId: string) {
  await lockSpace(tx, spaceId);
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
  { spaceId, readOnlySpaceId, ...input }: CreateListInput,
): Promise<TodoListOutput> {
  return db.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT 1 FROM users WHERE id = ${userId} FOR UPDATE`;
    // Ses listes encore à lui : laissées à un Espace quitté, elles ne comptent plus.
    const count = await tx.todoList.count({ where: { ownerId: userId, ...visibleTo(userId) } });
    if (count >= TODO_MAX_LISTS) throw todoConflict("TOO_MANY_LISTS");
    const sharedWith = spaceId ?? readOnlySpaceId;
    if (sharedWith !== undefined) await assertSharingSpace(tx, userId, sharedWith);
    const list = await tx.todoList.create({
      data: {
        ...input,
        ownerId: userId,
        spaceId: spaceId ?? null,
        readOnlySpaceId: readOnlySpaceId ?? null,
      },
      select: listSelect(userId),
    });
    return toListOutput(userId, list);
  });
}

/** Liste qui change d'Espace (`null` : redevient perso) : seuls ses membres gardent leurs tâches, pour de bon. */
async function unassignOutsideSpace(tx: DbTransaction, listId: string, spaceId: string | null) {
  await tx.task.updateMany({
    where: {
      listId,
      assigneeId: { not: null },
      ...(spaceId === null ? {} : { assignee: { spaces: { none: { spaceId } } } }),
    },
    data: { assigneeId: null, version: { increment: 1 } },
  });
}

/**
 * Liste montrée à un Espace : « Cochée par » ne vaut que sur une liste partagée, et ses lecteurs ne sont pas forcément
 * ceux qui ont coché. Seul `ownerId`, seul à écrire désormais, reste nommé.
 */
async function forgetOtherCompleters(tx: DbTransaction, listId: string, ownerId: string) {
  await tx.task.updateMany({
    where: { listId, completedById: { not: ownerId } },
    data: { completedById: null },
  });
}

type SharingInput = Pick<UpdateListInput, "spaceId" | "readOnlySpaceId">;

/** Champ absent : inchangé. */
type SharingChange = { [Field in keyof SharingInput]?: Exclude<SharingInput[Field], undefined> };

/** Une liste n'a qu'un partage à la fois : en choisir un retire l'autre. */
function nextSharing({ spaceId, readOnlySpaceId }: SharingInput): SharingChange {
  if (typeof spaceId === "string") return { spaceId, readOnlySpaceId: null };
  if (typeof readOnlySpaceId === "string") return { spaceId: null, readOnlySpaceId };
  return {
    ...(spaceId === undefined ? {} : { spaceId }),
    ...(readOnlySpaceId === undefined ? {} : { readOnlySpaceId }),
  };
}

/** Changer de partage demande le droit `share`, vérifié par la garde ; l'Espace visé l'est ici. */
export async function updateList(
  db: Db,
  userId: string,
  { listId, version, name, tint, spaceId, readOnlySpaceId }: UpdateListInput,
): Promise<TodoListOutput> {
  const sharing = nextSharing({ spaceId, readOnlySpaceId });
  const sharedWith = sharing.spaceId ?? sharing.readOnlySpaceId;
  return db.$transaction(async (tx) => {
    if (typeof sharedWith === "string") await assertSharingSpace(tx, userId, sharedWith);
    const { count } = await tx.todoList.updateMany({
      where: { id: listId, version },
      // Champ absent : inchangé (Prisma refuse `undefined` explicite avec `exactOptionalPropertyTypes`).
      data: {
        ...(name === undefined ? {} : { name }),
        ...(tint === undefined ? {} : { tint }),
        ...sharing,
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
    if (sharing.spaceId !== undefined) await unassignOutsideSpace(tx, listId, sharing.spaceId);
    if (typeof sharing.readOnlySpaceId === "string") {
      await forgetOtherCompleters(tx, listId, userId);
    }
    return toListOutput(userId, list);
  });
}

/**
 * Liste perso, même montrée à un Espace : son propriétaire. Liste partagée : les membres de son Espace, son créateur d'abord s'il en est
 * encore membre, puis par ordre d'arrivée.
 */
export async function listMembers(
  db: Db,
  listId: string,
  callerId: string,
): Promise<ListMembersOutput> {
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
  if (list.space === null) return { items: [toPerson(list.owner)], callerId };
  const members = list.space.members.map(({ user }) => user);
  const creatorFirst = [
    ...members.filter(({ id }) => id === list.owner.id),
    ...members.filter(({ id }) => id !== list.owner.id),
  ];
  return { items: creatorFirst.map(toPerson), callerId };
}

/** Ses tâches partent avec elle (`onDelete: Cascade`). */
export async function deleteList(db: Db, listId: string): Promise<void> {
  await db.todoList.deleteMany({ where: { id: listId } });
}
