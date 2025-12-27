import { healthCheck } from "../controllers/health.ts";
import { presignUpload, confirmUpload } from "../controllers/uploads.ts";
import { listImages, deleteImage } from "../controllers/images.ts";
import { notFound } from "../lib/responses.ts";

export async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const method = req.method;

  if (method === "GET" && (path === "/" || path === "/api/health")) {
    return healthCheck();
  }

  if (method === "POST" && path === "/api/presign-upload") {
    return presignUpload(req);
  }

  if (method === "POST" && path === "/api/confirm-upload") {
    return confirmUpload(req);
  }

  if (method === "GET" && path === "/api/images") {
    return listImages(req);
  }

  if (method === "DELETE" && path.startsWith("/api/images/")) {
    return deleteImage(req);
  }

  return notFound();
}
