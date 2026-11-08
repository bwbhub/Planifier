import { userProcedure } from "../../../procedures";
import { importGuard } from "./imports.guard";
import { createImport, deleteImport, listImports, refreshImport } from "./imports.service";

export const importsRouter = {
  // Filtré par l'appelant : ses seuls agendas importés.
  list: userProcedure.agenda.imports.list.handler(({ context }) =>
    listImports(context.getDb(), context.user.id),
  ),
  create: userProcedure.agenda.imports.create.handler(({ context, input }) =>
    createImport(context.getDb(), context.imports, context.user.id, input),
  ),
  refresh: userProcedure.agenda.imports.refresh
    .use(importGuard)
    .handler(({ context, input }) =>
      refreshImport(context.getDb(), context.imports, context.user.id, input.subscriptionId),
    ),
  delete: userProcedure.agenda.imports.delete
    .use(importGuard)
    .handler(async ({ context, input }) => {
      await deleteImport(context.getDb(), context.user.id, input.subscriptionId);
      return {};
    }),
};
