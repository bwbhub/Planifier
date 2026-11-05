import { THEME_PREFERENCES } from "@planifier/constants/account";
import { z } from "zod";

import { modulesSchema } from "../../_shared/modules.schemas";

/** Thème préféré, liste fermée de `@planifier/constants`. */
export const themePreferenceSchema = z.enum(THEME_PREFERENCES);

export const meInputSchema = z.strictObject({});

/** Profil de l'utilisateur connecté : liste blanche, jamais le modèle complet. */
export const meOutputSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  preferredTheme: themePreferenceSchema,
  /** Modules activés dans son espace personnel : ils décident de ce que la navigation montre. */
  modules: modulesSchema,
});

export type MeOutput = z.infer<typeof meOutputSchema>;

/** Remplace la liste des modules activés (vide permis : l'utilisateur n'en veut aucun). */
export const setModulesInputSchema = z.strictObject({ modules: modulesSchema });
export const setModulesOutputSchema = z.strictObject({ modules: modulesSchema });
