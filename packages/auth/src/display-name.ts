import { z } from "zod";

/** Bornes du nom affiché ; Better Auth n'accepte que `z.string()`, une chaîne vide passerait. */
export const DISPLAY_NAME_MAX_LENGTH = 100;

const displayNameSchema = z.string().trim().min(1).max(DISPLAY_NAME_MAX_LENGTH);

/** Nom affiché nettoyé (espaces de bord retirés), ou `null` s'il est vide ou trop long. */
export function parseDisplayName(name: unknown): string | null {
  const result = displayNameSchema.safeParse(name);
  return result.success ? result.data : null;
}
