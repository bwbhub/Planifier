import { ORPCError, os } from "@orpc/server";
import type { ResourceAction } from "@planifier/domain-access/resource";
import { canAccessTodoList, type TodoListAccess } from "@planifier/domain-access/todo-list";

import type { UserContext } from "../../procedures";
import { listAccessSelect, toListAccess } from "./list-access";

/** Sans lecture ⇒ NOT_FOUND (null : liste introuvable) ; visible mais action refusée ⇒ FORBIDDEN. */
function assertListAccess(access: TodoListAccess | null, action: ResourceAction) {
  if (access === null) throw new ORPCError("NOT_FOUND");
  if (canAccessTodoList(access, action)) return;
  throw new ORPCError(canAccessTodoList(access, "read") ? "FORBIDDEN" : "NOT_FOUND");
}

/**
 * Garde de liste, après la validation d'entrée : droit `action` de l'appelant sur la liste `listId`. `action` peut
 * dépendre de l'entrée (changer l'Espace d'une liste demande `share`, le reste `write`).
 */
export function listGuard<TInput extends { listId: string }>(
  action: ResourceAction | ((input: TInput) => ResourceAction),
) {
  return os.$context<UserContext>().middleware(async ({ context, next }, input: TInput) => {
    const userId = context.user.id;
    const list = await context.getDb().todoList.findUnique({
      where: { id: input.listId },
      select: listAccessSelect(userId),
    });
    const required = typeof action === "function" ? action(input) : action;
    assertListAccess(list === null ? null : toListAccess(userId, list), required);
    return next();
  });
}

/** Garde de tâche, après la validation d'entrée : droit `action` de l'appelant sur la liste de la tâche `taskId`. */
export function taskGuard(action: ResourceAction) {
  return os
    .$context<UserContext>()
    .middleware(async ({ context, next }, input: { taskId: string }) => {
      const userId = context.user.id;
      const task = await context.getDb().task.findUnique({
        where: { id: input.taskId },
        select: { list: { select: listAccessSelect(userId) } },
      });
      assertListAccess(task === null ? null : toListAccess(userId, task.list), action);
      return next();
    });
}
