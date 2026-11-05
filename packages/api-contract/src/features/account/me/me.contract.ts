import { oc } from "@orpc/contract";

import {
  meInputSchema,
  meOutputSchema,
  setModulesInputSchema,
  setModulesOutputSchema,
} from "./me.schemas";

export const meContract = {
  get: oc
    .route({
      summary: "Utilisateur connecté",
      description: "Profil de l'utilisateur de la session. Sans session : UNAUTHORIZED.",
    })
    .input(meInputSchema)
    .output(meOutputSchema),
  setModules: oc
    .route({
      summary: "Modules activés",
      description:
        "Remplace les modules de l'espace personnel de l'utilisateur de la session. Sans session : UNAUTHORIZED.",
    })
    .input(setModulesInputSchema)
    .output(setModulesOutputSchema),
};
