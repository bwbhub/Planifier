import { userProcedure } from "../../../procedures";
import { spaceGuard } from "../space-guard";
import { removeMember, setMemberRole } from "./members.service";

export const membersRouter = {
  setRole: userProcedure.spaces.members.setRole
    .use(spaceGuard("manage_members"))
    .handler(({ context, input }) => setMemberRole(context.getDb(), input)),
  remove: userProcedure.spaces.members.remove
    .use(spaceGuard("manage_members"))
    .handler(async ({ context, input }) => {
      await removeMember(context.getDb(), { ...input, callerId: context.user.id });
      return {};
    }),
};
