import { z } from "zod";

import { removePushSubscription } from "./service";
import { pushEndpointSchema } from "./validation";

const forgetDeviceBodySchema = z.object({ endpoint: pushEndpointSchema }).strict();

// A JSON DELETE already needs a CORS preflight no other origin passes; this
// refuses anything a browser marks as not same-origin as a second line.
function isCrossSiteRequest(headers: Headers): boolean {
  const site = headers.get("sec-fetch-site");
  return site !== null && site !== "same-origin";
}

async function readJson(request: Request): Promise<unknown> {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}

// Sign-out's last call while the session still exists (ADR-0012): Feudo
// forgets the endpoint the browser just gave up, for this person only.
export async function handleForgetDeviceRequest(request: Request): Promise<Response> {
  if (isCrossSiteRequest(request.headers)) {
    return new Response(null, { status: 403 });
  }
  const parsed = forgetDeviceBodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return new Response(null, { status: 400 });
  }
  const outcome = await removePushSubscription(parsed.data.endpoint);
  switch (outcome.status) {
    case "ok":
    case "disabled":
      return new Response(null, { status: 204 });
    case "unauthenticated":
      return new Response(null, { status: 401 });
    case "invalid":
      return new Response(null, { status: 400 });
  }
}
