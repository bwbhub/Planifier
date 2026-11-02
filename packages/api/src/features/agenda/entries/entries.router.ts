import { userProcedure } from "../../../procedures";
import { spaceGuard } from "../../spaces/space-guard";
import { entryGuard } from "../agenda-guard";
import {
  createEntry,
  deleteEntry,
  listEntries,
  listSpaceEntries,
  updateEntry,
} from "./entries.service";

export const entriesRouter = {
  // Filtré par l'appelant : ses seules entrées.
  list: userProcedure.agenda.entries.list.handler(({ context, input }) =>
    listEntries(context.getDb(), context.user.id, input),
  ),
  listInSpace: userProcedure.agenda.entries.listInSpace
    .use(spaceGuard("view"))
    .handler(({ context, input }) => listSpaceEntries(context.getDb(), context.user.id, input)),
  create: userProcedure.agenda.entries.create.handler(({ context, input }) =>
    createEntry(context.getDb(), context.user.id, input),
  ),
  update: userProcedure.agenda.entries.update
    .use(entryGuard("write"))
    .handler(({ context, input }) => updateEntry(context.getDb(), context.user.id, input)),
  delete: userProcedure.agenda.entries.delete
    .use(entryGuard("delete"))
    .handler(async ({ context, input }) => {
      await deleteEntry(context.getDb(), input.entryId);
      return {};
    }),
};
