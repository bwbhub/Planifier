import { THEME_PREFERENCES } from "@planifier/constants/account";
import { z } from "zod";

/** Thème préféré, liste fermée de `@planifier/constants`. */
export const themePreferenceSchema = z.enum(THEME_PREFERENCES);

export const meInputSchema = z.strictObject({});

/** Profil de l'utilisateur connecté : liste blanche, jamais le modèle complet. */
export const meOutputSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  preferredTheme: themePreferenceSchema,
});

export type MeOutput = z.infer<typeof meOutputSchema>;
