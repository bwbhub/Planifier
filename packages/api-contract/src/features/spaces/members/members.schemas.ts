import { z } from "zod";

import { spaceIdSchema, spaceRoleSchema, userIdSchema } from "../spaces.schemas";

export const setMemberRoleInputSchema = z.strictObject({
  spaceId: spaceIdSchema,
  userId: userIdSchema,
  role: spaceRoleSchema,
});

/** Retirer un autre membre ; pour partir soi-même : `spaces.space.leave`. */
export const removeMemberInputSchema = z.strictObject({
  spaceId: spaceIdSchema,
  userId: userIdSchema,
});
