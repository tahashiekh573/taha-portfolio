import { NextResponse } from "next/server";
import { adminRoute, jsonError, revalidateContent } from "@/lib/api";
import { sectionSchemas } from "@/lib/schemas";
import { getStore } from "@/lib/store";
import type { SectionKey, SiteContent } from "@/lib/types";

export const PUT = adminRoute(async (req, ctx: { params: Promise<{ section: string }> }) => {
  const { section } = await ctx.params;
  if (!(section in sectionSchemas)) return jsonError("Unknown section", 404);
  const key = section as SectionKey;
  const parsed = sectionSchemas[key].safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return jsonError(parsed.error.issues.map((i) => `${i.path.join(".") || key}: ${i.message}`).join("; "), 422);
  }
  await getStore().saveSection(key, parsed.data as SiteContent[typeof key]);
  revalidateContent();
  return NextResponse.json({ ok: true, value: parsed.data });
});
