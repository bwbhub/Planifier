import { oc } from "@orpc/contract";

import { emptyOutputSchema, SPACE_ERRORS } from "../spaces.schemas";
import {
  acceptInviteOutputSchema,
  createdInviteSchema,
  createInviteInputSchema,
  invitePreviewSchema,
  inviteTokenInputSchema,
  listInvitesInputSchema,
  listInvitesOutputSchema,
  revokeInviteInputSchema,
} from "./invites.schemas";

// Liens d'invitation à un Espace : à usage unique, à durée limitée. Rien n'est envoyé : l'appelant partage le lien.
export const invitesContract = {
  create: oc
    .route({
      summary: "Créer un lien d'invitation",
      description: "Propriétaires seulement. Trop de liens en cours : CONFLICT `TOO_MANY_INVITES`.",
    })
    .errors(SPACE_ERRORS)
    .input(createInviteInputSchema)
    .output(createdInviteSchema),
  list: oc
    .route({ summary: "Liens en cours", description: "Propriétaires seulement. Sans les jetons." })
    .input(listInvitesInputSchema)
    .output(listInvitesOutputSchema),
  revoke: oc
    .route({ summary: "Révoquer un lien", description: "Propriétaires seulement." })
    .input(revokeInviteInputSchema)
    .output(emptyOutputSchema),
  preview: oc
    .route({
      summary: "Voir une invitation",
      description:
        "Pour la personne connectée qui ouvre le lien. Lien inconnu, utilisé ou expiré : NOT_FOUND.",
    })
    .input(inviteTokenInputSchema)
    .output(invitePreviewSchema),
  accept: oc
    .route({
      summary: "Rejoindre un Espace",
      description:
        "Consomme le lien. Déjà membre : rien ne change, le lien reste valable. Espace plein : CONFLICT `SPACE_FULL`.",
    })
    .errors(SPACE_ERRORS)
    .input(inviteTokenInputSchema)
    .output(acceptInviteOutputSchema),
};
