import { oc } from "@orpc/contract";

import { emptyOutputSchema } from "../../_shared/empty.schemas";
import { EVENT_ERRORS, eventTargetSchema } from "../events.schemas";
import {
  createEventInputSchema,
  eventDetailSchema,
  listEventsInputSchema,
  listEventsOutputSchema,
  participantsOutputSchema,
  removeParticipantInputSchema,
  respondInputSchema,
  respondOutputSchema,
  setEventSpaceInputSchema,
  setRoleInputSchema,
  updateEventInputSchema,
} from "./event.schemas";

// Un événement dont l'appelant n'a pas le droit de lecture n'existe pas pour lui : NOT_FOUND ; visible mais action
// refusée : FORBIDDEN.
export const eventContract = {
  list: oc
    .route({
      summary: "Mes événements",
      description:
        "Événements où l'appelant participe, auxquels il est invité (même adresse e-mail) ou que son Espace lui montre, à venir ou passés. À venir : le plus proche d'abord, ceux en cours comptent ; passés : le plus récent d'abord.",
    })
    .input(listEventsInputSchema)
    .output(listEventsOutputSchema),
  get: oc
    .route({
      summary: "Un événement",
      description: "Détail et droits de l'appelant. Sans droit de lecture : NOT_FOUND.",
    })
    .input(eventTargetSchema)
    .output(eventDetailSchema),
  create: oc
    .route({
      summary: "Créer un événement",
      description:
        "L'appelant en est le propriétaire et y va. Avec `spaceId` : membre de l'Espace, sinon NOT_FOUND ; Événements désactivé dans l'Espace : CONFLICT `EVENTS_DISABLED`.",
    })
    .errors(EVENT_ERRORS)
    .input(createEventInputSchema)
    .output(eventDetailSchema),
  update: oc
    .route({
      summary: "Modifier un événement",
      description:
        "Propriétaire et co-organisateurs. `version` périmée : CONFLICT `STALE_VERSION`. Changer la date ou le lieu ajoute un message « Changement » aux commentaires, sans notification.",
    })
    .errors(EVENT_ERRORS)
    .input(updateEventInputSchema)
    .output(eventDetailSchema),
  setSpace: oc
    .route({
      summary: "Rattacher un événement à un Espace",
      description:
        "Propriétaire seulement. `spaceId` : un Espace dont il est membre, Événements activé (CONFLICT `EVENTS_DISABLED`) ; `null` : événement personnel et privé.",
    })
    .errors(EVENT_ERRORS)
    .input(setEventSpaceInputSchema)
    .output(eventDetailSchema),
  delete: oc
    .route({
      summary: "Supprimer un événement",
      description: "Propriétaire seulement. Emporte participants, invitations et commentaires.",
    })
    .input(eventTargetSchema)
    .output(emptyOutputSchema),
  respond: oc
    .route({
      summary: "Répondre à un événement",
      description:
        "J'y vais, peut-être, je n'y vais pas. Un invité par e-mail devient participant à sa réponse. Plus de place pour « J'y vais » : CONFLICT `EVENT_FULL` (qui y allait déjà garde sa place).",
    })
    .errors(EVENT_ERRORS)
    .input(respondInputSchema)
    .output(respondOutputSchema),
  participants: oc
    .route({
      summary: "Participants d'un événement",
      description:
        "Comptes par réponse pour tous ceux qui voient l'événement ; liste des personnes seulement si l'appelant voit les invités ; invitations (avec adresse) pour les organisateurs seulement.",
    })
    .input(eventTargetSchema)
    .output(participantsOutputSchema),
  setRole: oc
    .route({
      summary: "Nommer ou retirer un co-organisateur",
      description:
        "Propriétaire seulement. Jamais le propriétaire ni soi-même : FORBIDDEN. Cible qui ne participe pas : NOT_FOUND.",
    })
    .input(setRoleInputSchema)
    .output(emptyOutputSchema),
  removeParticipant: oc
    .route({
      summary: "Retirer un participant",
      description:
        "Le propriétaire retire un co-organisateur ou un invité ; un co-organisateur retire un invité. Jamais le propriétaire ni soi-même : FORBIDDEN.",
    })
    .input(removeParticipantInputSchema)
    .output(emptyOutputSchema),
};
