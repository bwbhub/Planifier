import { oc } from "@orpc/contract";

import { meInputSchema, meOutputSchema } from "./me.schemas";

export const meContract = {
  get: oc
    .route({
      summary: "Utilisateur connecté",
      description: "Profil de l'utilisateur de la session. Sans session : UNAUTHORIZED.",
    })
    .input(meInputSchema)
    .output(meOutputSchema),
};
