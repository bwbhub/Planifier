import { MODULES, SPACE_MAX_MEMBERS, SPACE_NAME_MAX_LENGTH } from "@planifier/constants/spaces";
import { z } from "zod";

import { spaceIdSchema, spaceRoleSchema, spaceTargetSchema, userIdSchema } from "../spaces.schemas";

const spaceNameSchema = z.string().trim().min(1).max(SPACE_NAME_MAX_LENGTH);

/** Modules activés pour l'Espace : liste fermée, sans doublon. */
const modulesSchema = z
  .array(z.enum(MODULES))
  .max(MODULES.length)
  .refine((modules) => new Set(modules).size === modules.length, "Module en double.");

const LIST_DEFAULT_LIMIT = 50;
const LIST_MAX_LIMIT = 100;

export const createSpaceInputSchema = z.strictObject({
  name: spaceNameSchema,
  modules: modulesSchema,
});

export const listSpacesInputSchema = z.strictObject({
  limit: z.int().min(1).max(LIST_MAX_LIMIT).default(LIST_DEFAULT_LIMIT),
  /** `nextCursor` de la page précédente. */
  cursor: z.uuid().optional(),
});

export const getSpaceInputSchema = spaceTargetSchema;
export const deleteSpaceInputSchema = spaceTargetSchema;
export const leaveSpaceInputSchema = spaceTargetSchema;

/** Réglages modifiés : au moins un ; `version` lue avec l'Espace (concurrence optimiste). */
export const updateSpaceInputSchema = z
  .strictObject({
    spaceId: spaceIdSchema,
    version: z.int().min(1),
    name: spaceNameSchema.optional(),
    modules: modulesSchema.optional(),
    restrictVisibility: z.boolean().optional(),
  })
  .refine(
    ({ name, modules, restrictVisibility }) =>
      name !== undefined || modules !== undefined || restrictVisibility !== undefined,
    "Aucun réglage à modifier.",
  );

/** Membre tel que les autres membres le voient : nom affiché seul, jamais l'e-mail (données minimales). */
export const spaceMemberSchema = z.strictObject({
  userId: userIdSchema,
  name: z.string(),
  role: spaceRoleSchema,
  joinedAt: z.date(),
  /** Créateur de l'Espace : propriétaire protégé, ni rétrogradé ni retiré par un autre. */
  isCreator: z.boolean(),
});

/** Espace vu par un de ses membres : `myRole` est le rôle de l'appelant. */
export const spaceSchema = z.strictObject({
  id: spaceIdSchema,
  name: z.string(),
  modules: z.array(z.enum(MODULES)),
  restrictVisibility: z.boolean(),
  version: z.int(),
  myRole: spaceRoleSchema,
});

export const spaceDetailSchema = spaceSchema.extend({
  members: z.array(spaceMemberSchema).max(SPACE_MAX_MEMBERS),
});

export const spaceSummarySchema = z.strictObject({
  id: spaceIdSchema,
  name: z.string(),
  myRole: spaceRoleSchema,
  memberCount: z.int(),
});

export const listSpacesOutputSchema = z.strictObject({
  items: z.array(spaceSummarySchema).max(LIST_MAX_LIMIT),
  /** null : dernière page. */
  nextCursor: z.uuid().nullable(),
});

/** `spaceDeleted` : l'appelant était le dernier membre, l'Espace n'existe plus. */
export const leaveSpaceOutputSchema = z.strictObject({ spaceDeleted: z.boolean() });

export type SpaceOutput = z.infer<typeof spaceSchema>;
export type SpaceDetailOutput = z.infer<typeof spaceDetailSchema>;
export type SpaceMemberOutput = z.infer<typeof spaceMemberSchema>;
export type SpaceSummaryOutput = z.infer<typeof spaceSummarySchema>;
export type ListSpacesOutput = z.infer<typeof listSpacesOutputSchema>;
export type CreateSpaceInput = z.output<typeof createSpaceInputSchema>;
export type ListSpacesInput = z.output<typeof listSpacesInputSchema>;
export type UpdateSpaceInput = z.output<typeof updateSpaceInputSchema>;
