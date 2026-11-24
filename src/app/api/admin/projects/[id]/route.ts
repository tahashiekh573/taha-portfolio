import { NextResponse } from "next/server";
import { adminRoute, jsonError, revalidateContent } from "@/lib/api";
import { projectSchema } from "@/lib/schemas";
import { ensureProjectsInitialized, getStore } from "@/lib/store";

type Ctx = { params: Promise<{ id: string }> };

export const PUT = adminRoute(async (req, ctx: Ctx) => {
  const { id } = await ctx.params;
  const raw = await req.json().catch(() => null);
  const parsed = projectSchema.safeParse({ ...raw, id });
  if (!parsed.success) return jsonError(parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; "), 422);
  const store = getStore();
  const projects = await ensureProjectsInitialized(store);
  if (!projects.some((p) => p.id === id)) return jsonError("Project not found", 404);
  if (projects.some((p) => p.slug === parsed.data.slug && p.id !== id)) return jsonError("Another project already uses this slug", 409);
  const project = { ...parsed.data, updatedAt: new Date().toISOString() };
  await store.saveProject(project);
  revalidateContent();
  return NextResponse.json({ ok: true, project });
});

export const DELETE = adminRoute(async (_req, ctx: Ctx) => {
  const { id } = await ctx.params;
  const store = getStore();
  const projects = await ensureProjectsInitialized(store);
  if (!projects.some((p) => p.id === id)) return jsonError("Project not found", 404);
  await store.deleteProject(id);
  revalidateContent();
  return NextResponse.json({ ok: true });
});
