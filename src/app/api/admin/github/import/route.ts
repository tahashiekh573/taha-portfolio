import { NextResponse } from "next/server";
import { z } from "zod";
import { adminRoute, jsonError, revalidateContent } from "@/lib/api";
import { parseGithubUrl } from "@/lib/github";
import { buildDraftFromRepo } from "@/lib/importer";
import { loadContentFresh } from "@/lib/content";
import { ensureProjectsInitialized, getStore } from "@/lib/store";

const schema = z.union([
  z.object({ repos: z.array(z.string().regex(/^[A-Za-z0-9._-]+$/)).min(1).max(30) }),
  z.object({ url: z.string().url().max(300) }),
]);

/** Imports repositories as draft projects (never published automatically). */
export const POST = adminRoute(async (req) => {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return jsonError("Provide repository names or a GitHub URL", 422);

  let targets: { owner: string; repo: string }[];
  if ("url" in parsed.data) {
    const ref = parseGithubUrl(parsed.data.url);
    if (!ref) return jsonError("That doesn't look like a GitHub repository URL", 422);
    targets = [ref];
  } else {
    const { profile } = await loadContentFresh();
    targets = parsed.data.repos.map((repo) => ({ owner: profile.githubUsername, repo }));
  }

  const store = getStore();
  const projects = await ensureProjectsInitialized(store);
  const slugs = new Set(projects.map((p) => p.slug));
  const repos = new Set(projects.map((p) => (p.repo ?? "").toLowerCase()));
  let order = projects.reduce((m, p) => Math.max(m, p.order), 0);

  const imported = [];
  const skipped: string[] = [];
  for (const t of targets) {
    if (repos.has(t.repo.toLowerCase())) {
      skipped.push(`${t.repo} (already in portfolio)`);
      continue;
    }
    try {
      const draft = await buildDraftFromRepo(t.owner, t.repo, ++order);
      let slug = draft.slug || "project";
      for (let i = 2; slugs.has(slug); i++) slug = `${draft.slug}-${i}`;
      draft.slug = slug;
      slugs.add(slug);
      await store.saveProject(draft);
      imported.push(draft);
    } catch (error) {
      skipped.push(`${t.repo} (${(error as Error).message})`);
    }
  }
  if (imported.length) revalidateContent();
  return NextResponse.json({ ok: true, imported, skipped });
});
