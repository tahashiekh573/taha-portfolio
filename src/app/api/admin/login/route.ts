import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/lib/env";
import { authConfigured, verifyPassword } from "@/lib/auth";
import { SESSION_COOKIE, SESSION_TTL_SECONDS, signSession } from "@/lib/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { jsonError, sameOrigin } from "@/lib/api";

const schema = z.object({ email: z.string().trim().toLowerCase().max(200), password: z.string().max(200) });

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Cross-origin request rejected", 403);
  if (!authConfigured()) {
    return jsonError("Admin login is not configured. Set ADMIN_EMAIL, ADMIN_PASSWORD_HASH and AUTH_SECRET.", 503);
  }
  const limit = await rateLimit(`login:${clientIp(req)}`, 5, 60 * 15);
  if (!limit.ok) return jsonError("Too many attempts. Try again in 15 minutes.", 429);

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid credentials", 401);

  const { email, password } = parsed.data;
  const passwordOk = await verifyPassword(password, env.adminPasswordHash);
  if (!passwordOk || email !== env.adminEmail) return jsonError("Invalid credentials", 401);

  const token = await signSession(env.adminEmail, env.authSecret);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: env.isProd,
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
  return res;
}
