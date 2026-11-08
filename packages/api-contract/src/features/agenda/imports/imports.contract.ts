import { oc } from "@orpc/contract";

import { emptyOutputSchema } from "../../_shared/empty.schemas";
import { AGENDA_ERRORS } from "../agenda.schemas";
import {
  createImportInputSchema,
  importFailureSchema,
  importSubscriptionSchema,
  importTargetSchema,
  listImportsInputSchema,
  listImportsOutputSchema,
} from "./imports.schemas";

/** `CONFLICT` Agenda, et `BAD_REQUEST` qui dit pourquoi un agenda n'a pas pu être lu. */
const IMPORT_ERRORS = { ...AGENDA_ERRORS, BAD_REQUEST: { data: importFailureSchema } };

// Un agenda importé n'existe que pour son propriétaire : pour tout autre, NOT_FOUND.
export const importsContract = {
  list: oc
    .route({ summary: "Mes agendas importés", description: "Ceux de l'appelant, jamais le lien." })
    .input(listImportsInputSchema)
    .output(listImportsOutputSchema),
  create: oc
    .route({
      summary: "Importer un agenda",
      description:
        "Lien privé d'un service admis (Google, Outlook, iCloud). Le lien est lu tout de suite : s'il échoue, rien n'est enregistré (BAD_REQUEST avec la raison). Au plus 5 agendas : CONFLICT `TOO_MANY_IMPORTS`.",
    })
    .errors(IMPORT_ERRORS)
    .input(createImportInputSchema)
    .output(importSubscriptionSchema),
  refresh: oc
    .route({
      summary: "Actualiser un agenda importé",
      description:
        "Relit le lien : crée, met à jour et retire les entrées importées. Moins d'une minute après la dernière lecture : CONFLICT `REFRESH_TOO_SOON`. Échec de lecture : BAD_REQUEST avec la raison, aussi gardée dans `lastError`.",
    })
    .errors(IMPORT_ERRORS)
    .input(importTargetSchema)
    .output(importSubscriptionSchema),
  delete: oc
    .route({
      summary: "Retirer un agenda importé",
      description: "Supprime l'abonnement et toutes les entrées qu'il avait importées.",
    })
    .input(importTargetSchema)
    .output(emptyOutputSchema),
};
