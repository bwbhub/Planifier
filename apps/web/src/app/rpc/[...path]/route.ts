import { proxyToApi } from "@/lib/api-proxy";

async function handle(request: Request, context: RouteContext<"/rpc/[...path]">) {
  const { path } = await context.params;
  return proxyToApi(request, path);
}

export const GET = handle;
export const POST = handle;
