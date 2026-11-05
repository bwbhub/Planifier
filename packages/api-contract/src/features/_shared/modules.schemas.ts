import { MODULES } from "@planifier/constants/spaces";
import { z } from "zod";

/** Modules activés (pour un Espace ou pour une personne) : liste fermée, sans doublon. */
export const modulesSchema = z
  .array(z.enum(MODULES))
  .max(MODULES.length)
  .refine((modules) => new Set(modules).size === modules.length, "Module en double.");
