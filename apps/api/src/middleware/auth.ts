import * as jose from "jose";
import { REGION, USER_POOL_ID, ALLOWED_EMAIL_DOMAINS } from "../lib/config.ts";
import { error } from "../lib/responses.ts";

// JWKS for Cognito
const jwksUri = USER_POOL_ID
  ? `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}/.well-known/jwks.json`
  : undefined;
const jwks = jwksUri ? jose.createRemoteJWKSet(new URL(jwksUri)) : undefined;

export type Claims = { email?: string; [k: string]: any };

export async function authenticate(
  req: Request,
): Promise<{ claims: Claims; groups: string[] } | Response> {
  const auth = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!auth || !auth.startsWith("Bearer ")) return error(401, "Missing Bearer token");
  const token = auth.slice("Bearer ".length);
  if (!jwks) return error(500, "Auth not configured");
  try {
    const { payload } = await jose.jwtVerify(token, jwks, {
      issuer: `https://cognito-idp.${REGION}.amazonaws.com/${USER_POOL_ID}`,
    });
    const groups = Array.isArray(payload["cognito:groups"])
      ? (payload["cognito:groups"] as string[])
      : [];
    return { claims: payload as Claims, groups };
  } catch (e) {
    return error(401, "Invalid token", String(e));
  }
}

export function requireRole(groups: string[], role: "dev" | "admin") {
  return groups.includes(role);
}

export function emailAllowed(email?: string): boolean {
  if (!ALLOWED_EMAIL_DOMAINS.length) return true; // unrestricted if unset
  if (!email) return false;
  const lower = email.toLowerCase();
  return ALLOWED_EMAIL_DOMAINS.some((d) => lower.endsWith(`@${d}`));
}
