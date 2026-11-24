import "server-only";
import { fetchLanguagesLive, fetchReadmeLive, fetchRepoLive, type GithubRepo } from "@/lib/github";
import type { Project, ProjectCategory } from "@/lib/types";
import { newId, prettifyRepoName, slugify } from "@/lib/utils";

function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^#+\s.*$/gm, " ")
    .replace(/^\s*[-*>|].*$/gm, " ")
    .replace(/[*_`~]/g, "");
}

/** First real paragraphs of a README, used as a starting point the admin can edit. */
export function readmeParagraphs(md: string | null, count = 2) {
  if (!md) return [];
  return stripMarkdown(md)
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 60)
    .slice(0, count);
}

function guessCategory(text: string, languages: string[]): ProjectCategory {
  const t = text.toLowerCase();
  if (/\b(jira|jsm|confluence|atlassian|itsm|service desk)\b/.test(t)) return "Enterprise Automation";
  if (/\b(agent|agents|langgraph|langchain|automation|assistant|mcp)\b/.test(t)) return "AI Agents & Automation";
  if (/\b(yolo|opencv|mediapipe|vision|detection|face|ocr|camera)\b/.test(t)) return "Computer Vision";
  if (/\b(machine learning|classif|regression|model|llm|nlp|neural|rag)\b/.test(t)) return "AI & Machine Learning";
  if (/\b(analysis|analytics|dashboard|forecast|dataset|pandas)\b/.test(t)) return "Data Science & Analytics";
  if (languages[0] === "Java") return "Java Projects";
  if (/\b(api|backend|fastapi|express|spring)\b/.test(t)) return "Backend Development";
  if (/\b(react|next\.js|full.?stack|website|web app)\b/.test(t)) return "Full Stack Development";
  return "Other";
}

export async function buildDraftFromRepo(owner: string, repoName: string, order: number, existing?: GithubRepo): Promise<Project> {
  const repo = existing ?? (await fetchRepoLive(owner, repoName));
  const [languages, readme] = await Promise.all([
    fetchLanguagesLive(owner, repo.name).catch(() => ({}) as Record<string, number>),
    fetchReadmeLive(owner, repo.name).catch(() => null),
  ]);
  const langNames = Object.keys(languages);
  const paragraphs = readmeParagraphs(readme, 3);
  const summary = (repo.description?.trim() || paragraphs[0] || `${prettifyRepoName(repo.name)} — details to be added.`).slice(0, 590);
  const readmeTitle = readme?.match(/^#\s+(.+)$/m)?.[1]?.replace(/[*_`]/g, "").trim();

  return {
    id: newId(),
    slug: slugify(repo.name),
    title: (readmeTitle && readmeTitle.length < 90 ? readmeTitle : prettifyRepoName(repo.name)).replace(/^[^\p{L}\p{N}]+/u, ""),
    repo: repo.name,
    githubUrl: repo.html_url,
    demoUrl: repo.homepage && /^https?:\/\//.test(repo.homepage) ? repo.homepage : undefined,
    summary,
    overview: paragraphs.slice(repo.description ? 0 : 1).join("\n\n") || undefined,
    objectives: [],
    functionality: [],
    features: [],
    tech: [...new Set([...langNames.slice(0, 6), ...(repo.topics ?? []).slice(0, 6)])],
    highlights: [],
    challenges: [],
    category: guessCategory(`${repo.name} ${repo.description ?? ""} ${readme ?? ""}`, langNames),
    status: "In development",
    visibility: "draft",
    featured: false,
    order,
    coverIcon: "code",
    gallery: [],
    updatedAt: new Date().toISOString(),
  };
}
