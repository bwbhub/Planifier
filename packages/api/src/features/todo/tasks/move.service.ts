import { ORPCError } from "@orpc/server";
import type { MoveTaskInput, TaskOutput } from "@planifier/api-contract";
import { TODO_LIST_MAX_TASKS } from "@planifier/constants/todo";
import type { Db } from "@planifier/db";
import { canBeAssigned } from "@planifier/domain-access/todo-list";

import { spaceMemberIds } from "../../_shared/list-access";
import { todoConflict } from "../todo-errors";
import { readTask } from "./tasks.service";

/**
 * Envoie une tâche et ses sous-tâches dans la liste `listId` (écrivable, vérifié par la garde, comme la liste de la
 * tâche). Sous le verrou de la liste cible : deux envois simultanés ne dépassent pas la borne. Un assigné qui n'est pas
 * membre de l'Espace de la cible est retiré (`canBeAssigned`), la tâche reste à faire ou cochée comme elle était.
 */
export async function moveTask(
  db: Db,
  { taskId, version, listId }: MoveTaskInput,
): Promise<TaskOutput> {
  return db.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<
      unknown[]
    >`SELECT 1 FROM todo_lists WHERE id = ${listId} FOR UPDATE`;
    // Supprimée entre la garde et le verrou.
    if (locked.length === 0) throw new ORPCError("NOT_FOUND");
    const task = await tx.task.findUnique({
      where: { id: taskId },
      select: { listId: true, parentId: true },
    });
    if (task === null) throw new ORPCError("NOT_FOUND");
    if (task.parentId !== null) throw todoConflict("SUBTASK_MOVE");
    // Déjà dans cette liste : rejouable, rien à écrire.
    if (task.listId === listId) return readTask(tx, taskId);

    const moved = (await tx.task.count({ where: { parentId: taskId } })) + 1;
    if ((await tx.task.count({ where: { listId } })) + moved > TODO_LIST_MAX_TASKS)
      throw todoConflict("LIST_FULL");

    const { count } = await tx.task.updateMany({
      where: { id: taskId, version },
      data: { listId, version: { increment: 1 } },
    });
    if (count === 0) throw todoConflict("STALE_VERSION");
    await tx.task.updateMany({ where: { parentId: taskId }, data: { listId } });

    const spaceMembers = await spaceMemberIds(tx, listId);
    const assigned = await tx.task.findMany({
      where: { OR: [{ id: taskId }, { parentId: taskId }], assigneeId: { not: null } },
      select: { id: true, assigneeId: true },
    });
    const unassignable = assigned
      .filter(({ assigneeId }) => assigneeId !== null && !canBeAssigned(assigneeId, spaceMembers))
      .map(({ id }) => id);
    if (unassignable.length > 0)
      await tx.task.updateMany({ where: { id: { in: unassignable } }, data: { assigneeId: null } });
    return readTask(tx, taskId);
  });
}
