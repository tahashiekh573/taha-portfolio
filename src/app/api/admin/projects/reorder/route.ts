import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, jsonError, revalidateContent } from "@/lib/api";
import { ensureProjectsInitialized, getStore } from "@/lib/store";

const schema = z.object({ ids: z.array(z.string().max(100)).max(500) });

export const PUT = adminRoute(async (req) => {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Invalid order", 422);
  const store = getStore();
  const projects = await ensureProjectsInitialized(store);
  const position = new Map(parsed.data.ids.map((id, i) => [id, i]));
  const reordered = projects
    .map((p) => ({ ...p, order: (position.get(p.id) ?? 1000 + p.order) + 1 }))
    .sort((a, b) => a.order - b.order)
    .map((p, i) => ({ ...p, order: i + 1 }));
  await store.replaceProjects(reordered);
  revalidateContent();
  return NextResponse.json({ ok: true, projects: reordered });
});
