import { z } from "zod";

export const meInputSchema = z.strictObject({});

/** Profil de l'utilisateur connecté : liste blanche, jamais le modèle complet. */
export const meOutputSchema = z.strictObject({
  id: z.string(),
  name: z.string(),
  email: z.email(),
});

export type MeOutput = z.infer<typeof meOutputSchema>;
