import { oc } from "@orpc/contract";

import { healthInputSchema, healthOutputSchema } from "./health.schemas";

export const healthContract = {
  get: oc
    .route({ summary: "État de l'API", description: "Répond si le serveur d'API est joignable." })
    .input(healthInputSchema)
    .output(healthOutputSchema),
};
