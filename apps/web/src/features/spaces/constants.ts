import type { AppModule } from "@planifier/constants/spaces";

/** Modules cochés à la création : visibles et décochables avant d'enregistrer. */
export const DEFAULT_SPACE_MODULES: readonly AppModule[] = ["TODO", "AGENDA"];

/** Ancre de la section des membres : un lien de la section « Quitter » y renvoie. */
export const MEMBERS_SECTION_ID = "membres";
