export function json(body: unknown, init: ResponseInit = {}) {
  return new Response(JSON.stringify(body), {
    headers: { "content-type": "application/json" },
    ...init,
  });
}

export function error(status: number, message: string, details?: unknown) {
  return json({ error: message, details }, { status });
}

export function notFound() {
  return error(404, "Not Found");
}
