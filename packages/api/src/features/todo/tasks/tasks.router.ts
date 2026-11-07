import { userProcedure } from "../../../procedures";
import { listGuard, taskGuard, tasksGuard } from "../todo-guard";
import { postponeTasks } from "./postpone.service";
import {
  completeOccurrence,
  createTask,
  deleteTask,
  finishTask,
  listTasks,
  setTaskDone,
  undoCompletion,
  updateTask,
} from "./tasks.service";
import { todayTasks } from "./today.service";

// Supprimer une tâche est une écriture dans sa liste : même droit que la modifier.
export const tasksRouter = {
  postpone: userProcedure.todo.tasks.postpone
    .use(tasksGuard("write"))
    .handler(({ context, input }) => postponeTasks(context.getDb(), input)),
  // Filtré par l'appelant : ses seules tâches (listes perso, assignées dans une liste partagée).
  today: userProcedure.todo.tasks.today.handler(({ context, input }) =>
    todayTasks(context.getDb(), context.user.id, input.date),
  ),
  list: userProcedure.todo.tasks.list
    .use(listGuard("read"))
    .handler(({ context, input }) => listTasks(context.getDb(), input.listId)),
  create: userProcedure.todo.tasks.create
    .use(listGuard("write"))
    .handler(({ context, input }) => createTask(context.getDb(), input)),
  update: userProcedure.todo.tasks.update
    .use(taskGuard("write"))
    .handler(({ context, input }) => updateTask(context.getDb(), input)),
  setDone: userProcedure.todo.tasks.setDone
    .use(taskGuard("write"))
    .handler(({ context, input }) =>
      setTaskDone(context.getDb(), input, { userId: context.user.id, at: new Date() }),
    ),
  completeOccurrence: userProcedure.todo.tasks.completeOccurrence
    .use(taskGuard("write"))
    .handler(({ context, input }) => completeOccurrence(context.getDb(), input)),
  finish: userProcedure.todo.tasks.finish
    .use(taskGuard("write"))
    .handler(({ context, input }) =>
      finishTask(context.getDb(), input, { userId: context.user.id, at: new Date() }),
    ),
  undoCompletion: userProcedure.todo.tasks.undoCompletion
    .use(taskGuard("write"))
    .handler(({ context, input }) => undoCompletion(context.getDb(), input)),
  delete: userProcedure.todo.tasks.delete
    .use(taskGuard("write"))
    .handler(async ({ context, input }) => {
      await deleteTask(context.getDb(), input.taskId);
      return {};
    }),
};
