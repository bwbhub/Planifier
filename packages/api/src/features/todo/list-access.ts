import type { TodoListAccess } from "@planifier/domain-access/todo-list";
import type { Prisma } from "@planifier/db";

/**
 * Ce qu'il faut lire d'une liste pour décider des droits de `userId` : propriétaire, Espace (nommé, pour la sortie),
 * adhésion de `userId` à cet Espace.
 */
export function listAccessSelect(userId: string) {
  return {
    ownerId: true,
    space: {
      select: { id: true, name: true, members: { where: { userId }, select: { role: true } } },
    },
  } as const satisfies Prisma.TodoListSelect;
}

type ListAccessRow = Prisma.TodoListGetPayload<{ select: ReturnType<typeof listAccessSelect> }>;

export function toListAccess(userId: string, { ownerId, space }: ListAccessRow): TodoListAccess {
  return {
    userId,
    ownerId,
    space: space === null ? null : { callerRole: space.members[0]?.role ?? null },
  };
}

/** Personne telle que les autres la voient (contrat `personSchema`) : nom affiché seul, jamais l'e-mail. */
export function toPerson({ id, name }: { id: string; name: string }) {
  return { userId: id, name };
}
