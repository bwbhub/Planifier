import { AGENDA_VIEWS, type AgendaView } from "@planifier/constants/agenda";
import { z } from "zod";

import { ROUTES } from "@/lib/routes";

/** Libellés et mot d'adresse de chaque vue. */
export const VIEWS: Record<AgendaView, { label: string; param: string }> = {
  DAY: { label: "Jour", param: "jour" },
  WEEK: { label: "Semaine", param: "semaine" },
  MONTH: { label: "Mois", param: "mois" },
};

/** Ce que l'adresse choisit ; `null` : à déduire de l'appareil (jour, largeur d'écran). */
export interface AgendaParams {
  view: AgendaView | null;
  day: string | null;
  spaceId: string | null;
}

const daySchema = z.iso.date();
const spaceIdSchema = z.uuid();

/** Paramètres de l'adresse, reçus tels quels : une valeur inconnue vaut absence. */
export function parseAgendaParams(params: {
  vue?: string | string[] | undefined;
  jour?: string | string[] | undefined;
  espace?: string | string[] | undefined;
}): AgendaParams {
  const day = daySchema.safeParse(params.jour);
  const spaceId = spaceIdSchema.safeParse(params.espace);
  return {
    view: AGENDA_VIEWS.find((view) => VIEWS[view].param === params.vue) ?? null,
    day: day.success ? day.data : null,
    spaceId: spaceId.success ? spaceId.data : null,
  };
}

/** Lien vers une période : partageable, et le bouton Retour du navigateur la retrouve. */
export function agendaHref({ view, day, spaceId }: AgendaParams): string {
  const query = new URLSearchParams();
  if (view !== null) query.set("vue", VIEWS[view].param);
  if (day !== null) query.set("jour", day);
  if (spaceId !== null) query.set("espace", spaceId);
  const search = query.toString();
  return search === "" ? ROUTES.agenda : `${ROUTES.agenda}?${search}`;
}
