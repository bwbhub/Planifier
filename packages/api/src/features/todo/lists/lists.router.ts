import { userProcedure } from "../../../procedures";
import { listGuard } from "../todo-guard";
import { createList, deleteList, listLists, updateList } from "./lists.service";

export const listsRouter = {
  // Filtré par l'appelant : seules ses listes sont lues.
  list: userProcedure.todo.lists.list.handler(({ context }) =>
    listLists(context.getDb(), context.user.id),
  ),
  create: userProcedure.todo.lists.create.handler(({ context, input }) =>
    createList(context.getDb(), context.user.id, input),
  ),
  update: userProcedure.todo.lists.update
    .use(listGuard("write"))
    .handler(({ context, input }) => updateList(context.getDb(), input)),
  delete: userProcedure.todo.lists.delete
    .use(listGuard("delete"))
    .handler(async ({ context, input }) => {
      await deleteList(context.getDb(), input.listId);
      return {};
    }),
};
