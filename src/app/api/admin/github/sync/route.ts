import { NextResponse } from "next/server";
import { adminRoute, jsonError } from "@/lib/api";
import { fetchReposLive } from "@/lib/github";
import { loadContentFresh, loadProjectsFresh } from "@/lib/content";

/** Preview: public repositories that are not yet in the portfolio. */
export const GET = adminRoute(async () => {
  const [{ profile }, projects] = await Promise.all([loadContentFresh(), loadProjectsFresh()]);
  let repos;
  try {
    repos = await fetchReposLive(profile.githubUsername);
  } catch (error) {
    return jsonError(`Could not reach GitHub: ${(error as Error).message}. Adding GITHUB_TOKEN raises rate limits.`, 502);
  }
  const known = new Set(projects.map((p) => (p.repo ?? "").toLowerCase()).filter(Boolean));
  const candidates = repos
    .filter((r) => !known.has(r.name.toLowerCase()))
    .map((r) => ({
      name: r.name,
      description: r.description,
      language: r.language,
      url: r.html_url,
      homepage: r.homepage,
      stars: r.stargazers_count,
      fork: r.fork,
      empty: r.size === 0,
      pushedAt: r.pushed_at,
    }));
  return NextResponse.json({ ok: true, total: repos.length, candidates });
});
