import "server-only";
import { scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { SESSION_COOKIE, verifySession } from "@/lib/session";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, keylen: number, opts: object) => Promise<Buffer>;

/**
 * Password hashes use the format  scrypt:<N>:<saltHex>:<hashHex>
 * (no "$" characters, so they are safe in .env files). Generate with `npm run hash-password`.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(":");
  if (parts.length !== 4 || parts[0] !== "scrypt") return false;
  const N = Number(parts[1]);
  const salt = Buffer.from(parts[2], "hex");
  const expected = Buffer.from(parts[3], "hex");
  if (!Number.isInteger(N) || N < 16384 || !salt.length || !expected.length) return false;
  const derived = await scrypt(password, salt, expected.length, { N, r: 8, p: 1, maxmem: 256 * N * 8 });
  return derived.length === expected.length && timingSafeEqual(derived, expected);
}

export function authConfigured() {
  return Boolean(env.adminEmail && env.adminPasswordHash && env.authSecret.length >= 32);
}

/** Returns the admin session or null. Use in every admin Route Handler. */
export async function getAdminSession() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return verifySession(token, env.authSecret, env.adminEmail);
}
