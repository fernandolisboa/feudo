import { handleForgetDeviceRequest } from "@/modules/notifications";

export async function DELETE(request: Request): Promise<Response> {
  return handleForgetDeviceRequest(request);
}
