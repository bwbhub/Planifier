import { userProcedure } from "../../../procedures";
import { spaceGuard } from "../space-guard";
import {
  acceptInvite,
  createInvite,
  listInvites,
  previewInvite,
  revokeInvite,
} from "./invites.service";

export const invitesRouter = {
  create: userProcedure.spaces.invites.create
    .use(spaceGuard("invite"))
    .handler(({ context, input }) =>
      createInvite(context.getDb(), { spaceId: input.spaceId, createdById: context.user.id }),
    ),
  list: userProcedure.spaces.invites.list
    .use(spaceGuard("invite"))
    .handler(({ context, input }) => listInvites(context.getDb(), input.spaceId)),
  revoke: userProcedure.spaces.invites.revoke
    .use(spaceGuard("invite"))
    .handler(async ({ context, input }) => {
      await revokeInvite(context.getDb(), input);
      return {};
    }),
  // Pas de garde d'Espace : la personne n'en est pas encore membre, le jeton tient lieu de droit.
  preview: userProcedure.spaces.invites.preview.handler(({ context, input }) =>
    previewInvite(context.getDb(), { token: input.token, userId: context.user.id }),
  ),
  accept: userProcedure.spaces.invites.accept.handler(({ context, input }) =>
    acceptInvite(context.getDb(), { token: input.token, userId: context.user.id }),
  ),
};
