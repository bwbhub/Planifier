import { oc } from "@orpc/contract";

import { emptyOutputSchema } from "../../_shared/empty.schemas";
import { AGENDA_ERRORS } from "../agenda.schemas";
import {
  agendaEntrySchema,
  createEntryInputSchema,
  deleteEntryInputSchema,
  listEntriesInputSchema,
  listEntriesOutputSchema,
  listSpaceEntriesInputSchema,
  listTaskEntriesInputSchema,
  listTaskEntriesOutputSchema,
  listSpaceEntriesOutputSchema,
  updateEntryInputSchema,
} from "./entries.schemas";

// Une entrée dont l'appelant n'a pas le droit de lecture n'existe pas pour lui : NOT_FOUND.
export const entriesContract = {
  list: oc
    .route({
      summary: "Mon agenda",
      description: "Entrées de l'appelant qui touchent la période, masquées comprises.",
    })
    .input(listEntriesInputSchema)
    .output(listEntriesOutputSchema),
  listForTask: oc
    .route({
      summary: "Mes créneaux d'une tâche",
      description:
        "Entrées de l'appelant liées à la tâche (`taskId`), dans l'ordre de création. Celles des autres ne sont jamais rendues : tâche inconnue ou invisible, liste vide.",
    })
    .input(listTaskEntriesInputSchema)
    .output(listTaskEntriesOutputSchema),
  listInSpace: oc
    .route({
      summary: "Vue fusionnée d'un Espace",
      description:
        "Entrées des membres qui touchent la période, sauf les masquées. Espace qui restreint sa visibilité : celles de l'appelant seulement. Agenda non activé : CONFLICT `AGENDA_DISABLED`.",
    })
    .errors(AGENDA_ERRORS)
    .input(listSpaceEntriesInputSchema)
    .output(listSpaceEntriesOutputSchema),
  create: oc
    .route({
      summary: "Créer une entrée",
      description:
        "Dans l'agenda de l'appelant. Nombre d'entrées au plus atteint : CONFLICT `TOO_MANY_ENTRIES`.",
    })
    .errors(AGENDA_ERRORS)
    .input(createEntryInputSchema)
    .output(agendaEntrySchema),
  update: oc
    .route({
      summary: "Modifier une entrée",
      description:
        "Propriétaire seulement, sinon FORBIDDEN. `version` périmée : CONFLICT `STALE_VERSION`.",
    })
    .errors(AGENDA_ERRORS)
    .input(updateEntryInputSchema)
    .output(agendaEntrySchema),
  delete: oc
    .route({
      summary: "Supprimer une entrée",
      description: "Propriétaire seulement, sinon FORBIDDEN.",
    })
    .input(deleteEntryInputSchema)
    .output(emptyOutputSchema),
};
