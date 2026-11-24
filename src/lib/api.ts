import "server-only";
import { revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import { CONTENT_TAG } from "@/lib/content";
import { StoreNotConfiguredError } from "@/lib/store";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

/** Rejects cross-site writes: the Origin header must match the request host. */
export function sameOrigin(req: Request) {
  if (req.method === "GET" || req.method === "HEAD") return true;
  const origin = req.headers.get("origin");
  if (!origin) return false;
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/** Wraps an admin Route Handler with authentication, CSRF and error handling. */
export function adminRoute<C>(handler: (req: Request, ctx: C) => Promise<Response>) {
  return async (req: Request, ctx: C) => {
    if (!sameOrigin(req)) return jsonError("Cross-origin request rejected", 403);
    const session = await getAdminSession();
    if (!session) return jsonError("Unauthorized", 401);
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof StoreNotConfiguredError) return jsonError(error.message, 503);
      console.error("[admin api]", error);
      return jsonError((error as Error).message || "Server error", 500);
    }
  };
}

export function revalidateContent() {
  revalidateTag(CONTENT_TAG, { expire: 0 });
}
