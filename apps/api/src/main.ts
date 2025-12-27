// Bun HTTP service refactored with logical endpoint groups
import { PORT } from "./lib/config.ts";
import { handleRequest } from "./routes";

console.log(`API listening on http://localhost:${PORT}`);

Bun.serve({
  port: PORT,
  async fetch(req) {
    return handleRequest(req);
  },
});
