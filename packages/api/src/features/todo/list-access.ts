import type { TodoListAccess } from "@planifier/domain-access/todo-list";
import type { Db, DbTransaction, Prisma } from "@planifier/db";

/**
 * Ce qu'il faut lire d'une liste pour décider des droits de `userId` : propriétaire, Espace (nommé, pour la sortie),
 * adhésion de `userId` à cet Espace ; de même pour l'Espace qui la voit en lecture seule.
 */
export function listAccessSelect(userId: string) {
  const spaceSelect = {
    select: { id: true, name: true, members: { where: { userId }, select: { role: true } } },
  } as const;
  return {
    ownerId: true,
    space: spaceSelect,
    readOnlySpace: spaceSelect,
  } as const satisfies Prisma.TodoListSelect;
}

type ListAccessRow = Prisma.TodoListGetPayload<{ select: ReturnType<typeof listAccessSelect> }>;

export function toListAccess(
  userId: string,
  { ownerId, space, readOnlySpace }: ListAccessRow,
): TodoListAccess {
  return {
    userId,
    ownerId,
    space: space === null ? null : { callerRole: space.members[0]?.role ?? null },
    isReader: (readOnlySpace?.members.length ?? 0) > 0,
  };
}

/** Membres de l'Espace de la liste ; liste perso : aucun. */
export async function spaceMemberIds(
  db: Db | DbTransaction,
  listId: string,
): Promise<ReadonlySet<string>> {
  const list = await db.todoList.findUnique({
    where: { id: listId },
    select: { space: { select: { members: { select: { userId: true } } } } },
  });
  return new Set(list?.space?.members.map(({ userId }) => userId));
}

/** Personne telle que les autres la voient (contrat `personSchema`) : nom affiché seul, jamais l'e-mail. */
export function toPerson({ id, name }: { id: string; name: string }) {
  return { userId: id, name };
}
