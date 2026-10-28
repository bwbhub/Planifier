import type { ContractRouterClient } from "@orpc/contract";

import { meContract } from "./features/account/me/me.contract";
import { invitesContract } from "./features/spaces/invites/invites.contract";
import { membersContract } from "./features/spaces/members/members.contract";
import { spaceContract } from "./features/spaces/space/space.contract";
import { healthContract } from "./features/system/health/health.contract";
import { listsContract } from "./features/todo/lists/lists.contract";
import { tasksContract } from "./features/todo/tasks/tasks.contract";

/** Contrat complet de l'API : source unique des types côté serveur et côté client (ADR 0003). */
export const contract = {
  system: { health: healthContract },
  account: { me: meContract },
  spaces: { space: spaceContract, members: membersContract, invites: invitesContract },
  todo: { lists: listsContract, tasks: tasksContract },
};

/** Client typé de l'API, dérivé du contrat. */
export type ApiClient = ContractRouterClient<typeof contract>;

export type { HealthOutput } from "./features/system/health/health.schemas";
export type { MeOutput } from "./features/account/me/me.schemas";
export type {
  CreatedInviteOutput,
  InvitePreviewOutput,
} from "./features/spaces/invites/invites.schemas";
export type {
  CreateSpaceInput,
  ListSpacesInput,
  ListSpacesOutput,
  SpaceDetailOutput,
  SpaceMemberOutput,
  SpaceOutput,
  UpdateSpaceInput,
} from "./features/spaces/space/space.schemas";
export type {
  CreateListInput,
  ListListsOutput,
  TodoListOutput,
  UpdateListInput,
} from "./features/todo/lists/lists.schemas";
export { createListInputSchema, updateListInputSchema } from "./features/todo/lists/lists.schemas";
export type {
  CreateTaskInput,
  ListTasksOutput,
  SetTaskDoneInput,
  TaskOutput,
  UpdateTaskInput,
} from "./features/todo/tasks/tasks.schemas";
export { createTaskInputSchema, updateTaskInputSchema } from "./features/todo/tasks/tasks.schemas";
export {
  TODO_CONFLICT_REASONS,
  type TodoConflictReason,
  todoConflictDataSchema,
} from "./features/todo/todo.schemas";
export { SPACE_CONFLICT_REASONS, type SpaceConflictReason } from "./features/spaces/spaces.schemas";
export {
  AUTH_ERROR_CODES,
  AUTH_ROUTES,
  type AuthRequestBodies,
  type AuthRoute,
  authErrorBodySchema,
  type ChangePasswordInput,
  changePasswordInputSchema,
  type RequestPasswordResetInput,
  requestPasswordResetInputSchema,
  type ResetPasswordInput,
  resetPasswordInputSchema,
  signInInputSchema,
  signUpInputSchema,
  type SignInInput,
  type SignUpInput,
  type UpdateProfileInput,
  updateProfileInputSchema,
} from "./features/account/auth/auth.schemas";
