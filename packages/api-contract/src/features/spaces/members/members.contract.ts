import { oc } from "@orpc/contract";

import { spaceMemberSchema } from "../space/space.schemas";
import { emptyOutputSchema, SPACE_ERRORS } from "../spaces.schemas";
import { removeMemberInputSchema, setMemberRoleInputSchema } from "./members.schemas";

// Propriétaires seulement. Personne visée hors de l'Espace : NOT_FOUND.
export const membersContract = {
  setRole: oc
    .route({
      summary: "Changer le rôle d'un membre",
      description:
        "Nommer ou rétrograder un propriétaire. Laisser l'Espace sans propriétaire : CONFLICT `LAST_OWNER`.",
    })
    .errors(SPACE_ERRORS)
    .input(setMemberRoleInputSchema)
    .output(spaceMemberSchema),
  remove: oc
    .route({
      summary: "Retirer un membre",
      description:
        "Retire un autre membre de l'Espace. Se viser soi-même : BAD_REQUEST (quitter l'Espace). Laisser l'Espace sans propriétaire : CONFLICT `LAST_OWNER`.",
    })
    .errors(SPACE_ERRORS)
    .input(removeMemberInputSchema)
    .output(emptyOutputSchema),
};
