import { ArrowUpRight, ExternalLink, GitFork, Star } from "lucide-react";
import Link from "next/link";
import type { Project } from "@/lib/types";
import { ProjectCover } from "@/components/site/project-cover";
import { GithubIcon } from "@/components/site/brand-icons";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RepoStat = { stargazers_count: number; forks_count: number; language: string | null; pushed_at: string };

export function ProjectCard({ project, stat, priority }: { project: Project; stat?: RepoStat; priority?: boolean }) {
  return (
    <article
      className={cn(
        "card group relative flex h-full flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:glow-ring",
        project.featured && "gradient-border",
      )}
    >
      <Link href={`/projects/${project.slug}`} tabIndex={-1} aria-hidden="true" className="block">
        <ProjectCover project={project} className="aspect-[16/9] w-full" priority={priority} />
      </Link>
      <div className="flex flex-1 flex-col p-5 sm:p-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <Badge className="border-transparent bg-[color-mix(in_oklab,var(--accent-1)_14%,transparent)] text-accent-1">
            {project.category}
          </Badge>
          {project.featured ? (
            <Badge className="border-transparent bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] text-accent-2">
              <Star className="size-3 fill-current" aria-hidden="true" /> Featured
            </Badge>
          ) : null}
        </div>
        <h3 className="text-lg font-semibold leading-snug text-fg">
          <Link href={`/projects/${project.slug}`} className="after:absolute after:inset-0 after:content-[''] focus-visible:outline-none">
            {project.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{project.summary}</p>
        {project.tech.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
            {project.tech.slice(0, 5).map((t) => (
              <li key={t} className="rounded-md bg-bg-elevated/70 px-2 py-0.5 font-mono text-[11px] text-muted ring-1 ring-line">
                {t}
              </li>
            ))}
            {project.tech.length > 5 ? (
              <li className="px-1 py-0.5 font-mono text-[11px] text-subtle">+{project.tech.length - 5}</li>
            ) : null}
          </ul>
        ) : null}

        <div className="mt-auto flex items-center justify-between gap-3 pt-5">
          <div className="relative z-10 flex items-center gap-1">
            {project.githubUrl ? (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-surface hover:text-fg"
                aria-label={`${project.title} on GitHub`}
              >
                <GithubIcon className="size-4" /> Code
              </a>
            ) : null}
            {project.demoUrl ? (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-muted transition hover:bg-surface hover:text-fg"
                aria-label={`${project.title} live demo`}
              >
                <ExternalLink className="size-4" /> Live demo
              </a>
            ) : null}
            {stat && (stat.stargazers_count > 0 || stat.forks_count > 0) ? (
              <span className="ml-1 inline-flex items-center gap-2 font-mono text-[11px] text-subtle">
                <span className="inline-flex items-center gap-0.5" title="Stars">
                  <Star className="size-3" aria-hidden="true" />
                  {stat.stargazers_count}
                </span>
                <span className="inline-flex items-center gap-0.5" title="Forks">
                  <GitFork className="size-3" aria-hidden="true" />
                  {stat.forks_count}
                </span>
              </span>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent-1" aria-hidden="true">
            View details <ArrowUpRight className="size-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </article>
  );
}
