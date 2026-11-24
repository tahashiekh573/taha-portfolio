import { NextResponse } from "next/server";
import { adminRoute } from "@/lib/api";
import { loadContentFresh, loadProjectsFresh } from "@/lib/content";
import { env, storeKind } from "@/lib/env";

export const GET = adminRoute(async () => {
  const [content, projects] = await Promise.all([loadContentFresh(), loadProjectsFresh()]);
  return NextResponse.json({
    ok: true,
    content,
    projects,
    status: {
      store: storeKind(),
      email: Boolean(env.resendKey),
      contactFrom: env.contactFrom,
      contactTo: env.contactEmail,
      githubToken: Boolean(env.githubToken),
      sharedRateLimit: Boolean(env.upstashUrl && env.upstashToken),
      adminEmail: env.adminEmail,
    },
  });
});
