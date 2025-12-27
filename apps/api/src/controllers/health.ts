import { json } from "../lib/responses.ts";

export async function healthCheck() {
  return json({ ok: true });
}
