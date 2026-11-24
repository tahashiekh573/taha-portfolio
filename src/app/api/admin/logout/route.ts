import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/session";
import { jsonError, sameOrigin } from "@/lib/api";

export async function POST(req: Request) {
  if (!sameOrigin(req)) return jsonError("Cross-origin request rejected", 403);
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, "", { httpOnly: true, path: "/", maxAge: 0, sameSite: "strict" });
  return res;
}
