import { SignJWT, jwtVerify } from "jose";

/** Session token helpers. Safe to import from proxy.ts (no Node-only APIs). */
export const SESSION_COOKIE = "taha_admin_session";
export const SESSION_TTL_SECONDS = 60 * 60 * 8; // 8 hours

function key(secret: string) {
  return new TextEncoder().encode(secret);
}

export async function signSession(email: string, secret: string) {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(email)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .setAudience("taha-portfolio-admin")
    .sign(key(secret));
}

export async function verifySession(token: string | undefined, secret: string, expectedEmail: string) {
  if (!token || !secret || secret.length < 32 || !expectedEmail) return null;
  try {
    const { payload } = await jwtVerify(token, key(secret), {
      algorithms: ["HS256"],
      audience: "taha-portfolio-admin",
    });
    if (payload.role !== "admin" || payload.sub !== expectedEmail) return null;
    return { email: payload.sub };
  } catch {
    return null;
  }
}
