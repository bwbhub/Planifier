import { z } from "zod";

/** Aucune entrée : l'objet vide reste strict pour refuser toute clé inattendue. */
export const healthInputSchema = z.strictObject({});

export const healthOutputSchema = z.strictObject({
  status: z.literal("ok"),
});

export type HealthOutput = z.infer<typeof healthOutputSchema>;
