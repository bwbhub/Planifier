import { z } from "zod";

/** Personne telle que les autres la voient : nom affiché seul, jamais l'e-mail (données minimales). */
export const personSchema = z.strictObject({ userId: z.uuid(), name: z.string() });
