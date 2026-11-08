import { ORPCError } from "@orpc/server";
import type { GetTaskOutput } from "@planifier/api-contract";
import { isListTint, TODO_LIST_MAX_TASKS } from "@planifier/constants/todo";
import type { Db, Prisma } from "@planifier/db";
import { canAccessTodoList } from "@planifier/domain-access/todo-list";

import { listAccessSelect, spaceMemberIds, toListAccess } from "../../_shared/list-access";
import { TASK_SELECT, toTaskOutput } from "./tasks.service";

function detailSelect(userId: string) {
  return {
    ...TASK_SELECT,
    list: { select: { id: true, name: true, tint: true, ...listAccessSelect(userId) } },
    subtasks: { orderBy: { id: "asc" }, take: TODO_LIST_MAX_TASKS, select: TASK_SELECT },
  } as const satisfies Prisma.TaskSelect;
}

/**
 * Détail d'une tâche pour `userId`. Le droit de lecture est vérifié avant (garde) ; `canWrite` dit seulement si
 * l'écran propose les modifications. Introuvable : NOT_FOUND, comme sans droit.
 */
export async function getTask(db: Db, userId: string, taskId: string): Promise<GetTaskOutput> {
  const row = await db.task.findUnique({ where: { id: taskId }, select: detailSelect(userId) });
  if (row === null) throw new ORPCError("NOT_FOUND");
  const { list, subtasks, ...task } = row;
  // Chaîne libre en base : une valeur inconnue est une donnée corrompue, pas une entrée à deviner.
  if (!isListTint(list.tint))
    throw new Error(`Teinte de liste inconnue en base (liste ${list.id}).`);
  const spaceMembers = await spaceMemberIds(db, list.id);
  return {
    task: toTaskOutput(task, spaceMembers),
    list: {
      id: list.id,
      name: list.name,
      tint: list.tint,
      canWrite: canAccessTodoList(toListAccess(userId, list), "write"),
    },
    subtasks: subtasks.map((subtask) => toTaskOutput(subtask, spaceMembers)),
  };
}
