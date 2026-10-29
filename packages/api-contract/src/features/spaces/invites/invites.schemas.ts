import { SPACE_MAX_ACTIVE_INVITES } from "@planifier/constants/spaces";
import { z } from "zod";

import { spaceIdSchema, spaceTargetSchema } from "../spaces.schemas";

/** Jeton d'un lien d'invitation : 32 octets aléatoires en base64url (43 caractères). */
export const inviteTokenSchema = z.string().regex(/^[\w-]{43}$/);

export const createInviteInputSchema = spaceTargetSchema;
export const listInvitesInputSchema = spaceTargetSchema;

export const revokeInviteInputSchema = z.strictObject({
  spaceId: spaceIdSchema,
  inviteId: z.uuid(),
});

export const inviteTokenInputSchema = z.strictObject({ token: inviteTokenSchema });

/** Lien en cours de validité, sans son jeton (jamais stocké). */
export const spaceInviteSchema = z.strictObject({
  id: z.uuid(),
  expiresAt: z.date(),
  createdAt: z.date(),
});

/** Seule réponse qui porte le jeton : le lien se partage tout de suite, il ne pourra plus être relu. */
export const createdInviteSchema = spaceInviteSchema.extend({ token: inviteTokenSchema });

export const listInvitesOutputSchema = z.strictObject({
  items: z.array(spaceInviteSchema).max(SPACE_MAX_ACTIVE_INVITES),
});

/** Ce que voit la personne qui ouvre le lien, avant de rejoindre. */
export const invitePreviewSchema = z.strictObject({
  spaceId: spaceIdSchema,
  spaceName: z.string(),
  memberCount: z.int(),
  alreadyMember: z.boolean(),
});

export const acceptInviteOutputSchema = z.strictObject({ spaceId: spaceIdSchema });

export type SpaceInviteOutput = z.infer<typeof spaceInviteSchema>;
export type CreatedInviteOutput = z.infer<typeof createdInviteSchema>;
export type InvitePreviewOutput = z.infer<typeof invitePreviewSchema>;
