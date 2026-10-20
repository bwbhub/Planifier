import { proxyToApi } from "@/lib/api-proxy";
import { API_PREFIXES } from "@/lib/api-target";

async function handle(request: Request, context: RouteContext<"/rpc/[...path]">) {
  const { path } = await context.params;
  return proxyToApi(request, API_PREFIXES.rpc, path);
}

export const GET = handle;
export const POST = handle;
