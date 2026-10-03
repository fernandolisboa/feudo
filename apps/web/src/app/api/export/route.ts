import { handleExportRequest } from "@/modules/privacy";

export async function POST(request: Request): Promise<Response> {
  return handleExportRequest(request);
}
