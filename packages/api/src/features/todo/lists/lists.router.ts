import { userProcedure } from "../../../procedures";
import { listGuard } from "../todo-guard";
import { createList, deleteList, listLists, listMembers, updateList } from "./lists.service";

export const listsRouter = {
  // Filtré par l'appelant : ses listes et celles des Espaces dont il est membre.
  list: userProcedure.todo.lists.list.handler(({ context, input }) =>
    listLists(context.getDb(), context.user.id, input),
  ),
  create: userProcedure.todo.lists.create.handler(({ context, input }) =>
    createList(context.getDb(), context.user.id, input),
  ),
  update: userProcedure.todo.lists.update
    .use(listGuard(({ spaceId }) => (spaceId === undefined ? "write" : "share")))
    .handler(({ context, input }) => updateList(context.getDb(), context.user.id, input)),
  members: userProcedure.todo.lists.members
    .use(listGuard("read"))
    .handler(({ context, input }) => listMembers(context.getDb(), input.listId)),
  delete: userProcedure.todo.lists.delete
    .use(listGuard("delete"))
    .handler(async ({ context, input }) => {
      await deleteList(context.getDb(), input.listId);
      return {};
    }),
};
