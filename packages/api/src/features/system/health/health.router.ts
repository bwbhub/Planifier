import { publicProcedure } from "../../../procedures";

export const healthRouter = {
  get: publicProcedure.system.health.get.handler(() => ({ status: "ok" as const })),
};
