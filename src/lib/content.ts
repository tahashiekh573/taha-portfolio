import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { siteSeed } from "@/content/site";
import { projectSeed } from "@/content/projects";
import { getStore } from "@/lib/store";
import type { Project, SiteContent } from "@/lib/types";

export const CONTENT_TAG = "portfolio-content";

function mergeSections(stored: Partial<SiteContent>): SiteContent {
  return {
    profile: { ...siteSeed.profile, ...(stored.profile ?? {}) },
    about: { ...siteSeed.about, ...(stored.about ?? {}) },
    experience: stored.experience ?? siteSeed.experience,
    education: stored.education ?? siteSeed.education,
    skills: stored.skills ?? siteSeed.skills,
    certifications: stored.certifications ?? siteSeed.certifications,
    resume: { ...siteSeed.resume, ...(stored.resume ?? {}) },
    settings: { ...siteSeed.settings, ...(stored.settings ?? {}) },
  };
}

const byOrder = (a: Project, b: Project) => a.order - b.order;

/** Uncached reads, used by the admin API. */
export async function loadContentFresh(): Promise<SiteContent> {
  return mergeSections(await getStore().getSections());
}
export async function loadProjectsFresh(): Promise<Project[]> {
  const stored = await getStore().listProjects();
  return [...(stored ?? projectSeed)].sort(byOrder);
}

/** Cached reads for the public site. Falls back to seed content if the database is unreachable. */
export async function getSiteContent(): Promise<SiteContent> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  try {
    return await loadContentFresh();
  } catch (error) {
    console.error("[content] falling back to seed content:", error);
    return mergeSections({});
  }
}

export async function getAllProjects(): Promise<Project[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CONTENT_TAG);
  try {
    return await loadProjectsFresh();
  } catch (error) {
    console.error("[content] falling back to seed projects:", error);
    return [...projectSeed].sort(byOrder);
  }
}

export async function getPublishedProjects(): Promise<Project[]> {
  return (await getAllProjects()).filter((p) => p.visibility === "published");
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  return (await getPublishedProjects()).find((p) => p.slug === slug);
}
