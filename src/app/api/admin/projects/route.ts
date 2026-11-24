import { NextResponse } from "next/server";
import { adminRoute, jsonError, revalidateContent } from "@/lib/api";
import { projectSchema } from "@/lib/schemas";
import { ensureProjectsInitialized, getStore } from "@/lib/store";
import { newId } from "@/lib/utils";

/** Create a project. */
export const POST = adminRoute(async (req) => {
  const raw = await req.json().catch(() => null);
  const parsed = projectSchema.safeParse({ ...raw, id: raw?.id || newId() });
  if (!parsed.success) return jsonError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 422);
  const store = getStore();
  const projects = await ensureProjectsInitialized(store);
  if (projects.some((p) => p.slug === parsed.data.slug)) return jsonError("A project with this slug already exists", 409);
  const project = { ...parsed.data, updatedAt: new Date().toISOString() };
  await store.saveProject(project);
  revalidateContent();
  return NextResponse.json({ ok: true, project });
});
