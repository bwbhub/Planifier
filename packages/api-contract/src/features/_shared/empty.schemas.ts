import { z } from "zod";

/** Sortie d'une procédure qui ne rend rien (suppression, départ) : objet vide, strict. */
export const emptyOutputSchema = z.strictObject({});
