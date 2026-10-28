import { meRouter } from "./features/account/me/me.router";
import { invitesRouter } from "./features/spaces/invites/invites.router";
import { membersRouter } from "./features/spaces/members/members.router";
import { spaceRouter } from "./features/spaces/space/space.router";
import { healthRouter } from "./features/system/health/health.router";
import { listsRouter } from "./features/todo/lists/lists.router";
import { tasksRouter } from "./features/todo/tasks/tasks.router";
import { routerBuilder } from "./procedures";

/** Routeur complet, vérifié contre le contrat. */
export const router = routerBuilder.router({
  system: { health: healthRouter },
  account: { me: meRouter },
  spaces: { space: spaceRouter, members: membersRouter, invites: invitesRouter },
  todo: { lists: listsRouter, tasks: tasksRouter },
});

export type ApiRouter = typeof router;
