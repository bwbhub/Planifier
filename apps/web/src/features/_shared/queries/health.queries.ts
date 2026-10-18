import { useQuery } from "@tanstack/react-query";

import { orpc } from "@/lib/orpc";

/** État de l'API (procédure `system.health.get`). */
export function useApiHealth() {
  return useQuery(orpc.system.health.get.queryOptions({ input: {} }));
}
