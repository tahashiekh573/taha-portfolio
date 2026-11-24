import "server-only";
import { cacheLife } from "next/cache";
import { env } from "@/lib/env";

export interface GithubRepo {
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  size: number;
  topics?: string[];
  pushed_at: string;
  default_branch: string;
}

export interface GithubProfile {
  login: string;
  avatar_url: string;
  html_url: string;
  public_repos: number;
  followers: number;
}

function headers(): HeadersInit {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "taha-portfolio",
  };
  if (env.githubToken) h.Authorization = `Bearer ${env.githubToken}`;
  return h;
}

async function gh<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: headers(), cache: "no-store" });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${url}`);
  return (await res.json()) as T;
}

/** Live (uncached) list of public repositories, used by the admin sync. */
export async function fetchReposLive(username = env.githubUsername): Promise<GithubRepo[]> {
  const repos: GithubRepo[] = [];
  for (let page = 1; page <= 5; page++) {
    const batch = await gh<GithubRepo[]>(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&page=${page}`,
    );
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos;
}

export async function fetchRepoLive(owner: string, repo: string) {
  return gh<GithubRepo>(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`);
}

export async function fetchLanguagesLive(owner: string, repo: string) {
  return gh<Record<string, number>>(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/languages`,
  );
}

export async function fetchReadmeLive(owner: string, repo: string): Promise<string | null> {
  const res = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/readme`,
    { headers: { ...headers(), Accept: "application/vnd.github.raw+json" }, cache: "no-store" },
  );
  if (!res.ok) return null;
  return res.text();
}

/** Cached repository stats for the public site. Returns null on any failure. */
export async function getRepoStats(): Promise<Record<string, Pick<GithubRepo, "stargazers_count" | "forks_count" | "language" | "pushed_at">> | null> {
  "use cache";
  cacheLife("hours");
  try {
    const repos = await fetchReposLive();
    return Object.fromEntries(
      repos.map((r) => [
        r.name.toLowerCase(),
        { stargazers_count: r.stargazers_count, forks_count: r.forks_count, language: r.language, pushed_at: r.pushed_at },
      ]),
    );
  } catch (error) {
    console.warn("[github] repo stats unavailable:", (error as Error).message);
    return null;
  }
}

export async function getGithubProfile(): Promise<GithubProfile | null> {
  "use cache";
  cacheLife("hours");
  try {
    return await gh<GithubProfile>(`https://api.github.com/users/${encodeURIComponent(env.githubUsername)}`);
  } catch (error) {
    console.warn("[github] profile unavailable:", (error as Error).message);
    return null;
  }
}

export function parseGithubUrl(input: string): { owner: string; repo: string } | null {
  const m = input
    .trim()
    .match(/^(?:https?:\/\/)?(?:www\.)?github\.com\/([A-Za-z0-9-]+)\/([A-Za-z0-9._-]+?)(?:\.git)?\/?(?:[#?].*)?$/);
  return m ? { owner: m[1], repo: m[2] } : null;
}
