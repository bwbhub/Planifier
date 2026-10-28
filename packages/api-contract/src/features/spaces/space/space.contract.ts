import { oc } from "@orpc/contract";

import { emptyOutputSchema, SPACE_ERRORS } from "../spaces.schemas";
import {
  createSpaceInputSchema,
  deleteSpaceInputSchema,
  getSpaceInputSchema,
  leaveSpaceInputSchema,
  leaveSpaceOutputSchema,
  listSpacesInputSchema,
  listSpacesOutputSchema,
  spaceDetailSchema,
  spaceSchema,
  updateSpaceInputSchema,
} from "./space.schemas";

// Un Espace dont l'appelant n'est pas membre n'existe pas pour lui : NOT_FOUND. Membre sans le droit : FORBIDDEN.
export const spaceContract = {
  create: oc
    .route({
      summary: "Créer un Espace",
      description: "L'appelant en devient le premier membre, propriétaire.",
    })
    .input(createSpaceInputSchema)
    .output(spaceSchema),
  list: oc
    .route({
      summary: "Mes Espaces",
      description:
        "Espaces dont l'appelant est membre, du plus ancien rejoint au plus récent. Pagination par curseur.",
    })
    .input(listSpacesInputSchema)
    .output(listSpacesOutputSchema),
  get: oc
    .route({ summary: "Un Espace", description: "Réglages et membres. Réservé aux membres." })
    .input(getSpaceInputSchema)
    .output(spaceDetailSchema),
  update: oc
    .route({
      summary: "Modifier un Espace",
      description:
        "Nom, modules, visibilité. Propriétaires seulement. `version` périmée : CONFLICT `STALE_VERSION`.",
    })
    .errors(SPACE_ERRORS)
    .input(updateSpaceInputSchema)
    .output(spaceSchema),
  delete: oc
    .route({
      summary: "Supprimer un Espace",
      description:
        "Propriétaires seulement. Ses événements deviennent personnels pour leur propriétaire (CONTEXT.md).",
    })
    .input(deleteSpaceInputSchema)
    .output(emptyOutputSchema),
  leave: oc
    .route({
      summary: "Quitter un Espace",
      description:
        "Dernier membre : l'Espace est supprimé. Dernier propriétaire alors qu'il reste des membres : CONFLICT `LAST_OWNER`.",
    })
    .errors(SPACE_ERRORS)
    .input(leaveSpaceInputSchema)
    .output(leaveSpaceOutputSchema),
};
