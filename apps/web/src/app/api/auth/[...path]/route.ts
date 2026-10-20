import { proxyToApi } from "@/lib/api-proxy";
import { API_PREFIXES } from "@/lib/api-target";

/** Routes de Better Auth (inscription, connexion, session…), servies par l'API (ADR 0015). */
async function handle(request: Request, context: RouteContext<"/api/auth/[...path]">) {
  const { path } = await context.params;
  return proxyToApi(request, API_PREFIXES.auth, path);
}

export const GET = handle;
export const POST = handle;
