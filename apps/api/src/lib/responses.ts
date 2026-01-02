export function json(body: unknown, init: ResponseInit = {}) {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  // Basic CORS for local dev; in prod CloudFront often handles this or we restrict more
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  return new Response(JSON.stringify(body), {
    ...init,
    headers,
  });
}

export function error(status: number, message: string, details?: unknown) {
  return json({ error: message, details }, { status });
}

export function notFound() {
  return error(404, "Not Found");
}
