import { userProcedure } from "../../../procedures";
import { spaceGuard } from "../space-guard";
import {
  createSpace,
  deleteSpace,
  getSpace,
  leaveSpace,
  listSpaces,
  updateSpace,
} from "./space.service";

export const spaceRouter = {
  create: userProcedure.spaces.space.create.handler(({ context, input }) =>
    createSpace(context.getDb(), context.user.id, input),
  ),
  // Filtré par l'appelant : seuls ses Espaces sont lus.
  list: userProcedure.spaces.space.list.handler(({ context, input }) =>
    listSpaces(context.getDb(), context.user.id, input),
  ),
  get: userProcedure.spaces.space.get
    .use(spaceGuard("view"))
    .handler(({ context, input }) => getSpace(context.getDb(), input.spaceId, context.spaceRole)),
  update: userProcedure.spaces.space.update
    .use(spaceGuard("update"))
    .handler(({ context, input }) => updateSpace(context.getDb(), context.spaceRole, input)),
  delete: userProcedure.spaces.space.delete
    .use(spaceGuard("delete"))
    .handler(async ({ context, input }) => {
      await deleteSpace(context.getDb(), input.spaceId);
      return {};
    }),
  leave: userProcedure.spaces.space.leave
    .use(spaceGuard("leave"))
    .handler(({ context, input }) => leaveSpace(context.getDb(), input.spaceId, context.user.id)),
};
