import type { Metadata } from "next";
import { ArrowLeft, CheckCircle2, ExternalLink, Layers, Lightbulb, ListChecks, Target, TriangleAlert, Wrench } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense, type ReactNode } from "react";
import { getProjectBySlug, getPublishedProjects } from "@/lib/content";
import { ProjectCover } from "@/components/site/project-cover";
import { GithubIcon } from "@/components/site/brand-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isOptimizable } from "@/lib/utils";

export async function generateStaticParams() {
  const projects = await getPublishedProjects();
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found" };
  return {
    title: project.title,
    description: project.summary,
    alternates: { canonical: `/projects/${project.slug}` },
    openGraph: { title: project.title, description: project.summary, type: "article" },
  };
}

export default function ProjectPage(props: PageProps<"/projects/[slug]">) {
  return (
    <Suspense fallback={<ProjectSkeleton />}>
      <ProjectDetails params={props.params} />
    </Suspense>
  );
}

function Block({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="card p-6 sm:p-8">
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-semibold text-fg">
        <span className="grid size-8 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] text-accent-2">
          {icon}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item) => (
        <li key={item} className="flex gap-3 text-[15px] leading-relaxed text-muted">
          <CheckCircle2 className="mt-1 size-4 shrink-0 text-accent-1" aria-hidden="true" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Paragraphs({ text }: { text: string }) {
  return (
    <div className="prose-body">
      {text.split(/\n{2,}/).map((p, i) => (
        <p key={i}>{p}</p>
      ))}
    </div>
  );
}

async function ProjectDetails({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  return (
    <article className="relative pb-24 pt-28 sm:pt-32">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent-1)_18%,transparent),transparent_70%)]" />
      <div className="mx-auto max-w-5xl px-5 sm:px-8">
        <Link href="/#projects" className="inline-flex items-center gap-2 text-sm text-muted transition hover:text-fg">
          <ArrowLeft className="size-4" /> All projects
        </Link>

        <header className="mt-6">
          <div className="flex flex-wrap gap-2">
            <Badge className="border-transparent bg-[color-mix(in_oklab,var(--accent-1)_14%,transparent)] text-accent-1">{project.category}</Badge>
            <Badge>Status: {project.status}</Badge>
          </div>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-fg sm:text-5xl">{project.title}</h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-muted">{project.summary}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {project.githubUrl ? (
              <Button asChild>
                <a href={project.githubUrl} target="_blank" rel="noopener noreferrer">
                  <GithubIcon /> View repository
                </a>
              </Button>
            ) : null}
            {project.demoUrl ? (
              <Button asChild variant="secondary">
                <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink /> Live demo
                </a>
              </Button>
            ) : null}
          </div>
        </header>

        {project.thumbnail ? (
          <ProjectCover
            project={project}
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="glow-ring mt-10 aspect-[16/8] w-full rounded-2xl border border-line"
          />
        ) : (
          <div aria-hidden="true" className="mt-10 h-px w-full bg-gradient-to-r from-transparent via-line-strong to-transparent" />
        )}

        <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {project.overview ? (
              <Block icon={<Lightbulb className="size-4" />} title="Overview">
                <Paragraphs text={project.overview} />
              </Block>
            ) : null}
            {project.problem ? (
              <Block icon={<Target className="size-4" />} title="Problem statement">
                <Paragraphs text={project.problem} />
              </Block>
            ) : null}
            {project.objectives.length ? (
              <Block icon={<ListChecks className="size-4" />} title="Objectives">
                <List items={project.objectives} />
              </Block>
            ) : null}
            {project.functionality.length ? (
              <Block icon={<Wrench className="size-4" />} title="Main functionality">
                <List items={project.functionality} />
              </Block>
            ) : null}
            {project.features.length ? (
              <Block icon={<CheckCircle2 className="size-4" />} title="Key features">
                <List items={project.features} />
              </Block>
            ) : null}
            {project.architecture ? (
              <Block icon={<Layers className="size-4" />} title="Architecture overview">
                <Paragraphs text={project.architecture} />
              </Block>
            ) : null}
            {project.highlights.length ? (
              <Block icon={<Lightbulb className="size-4" />} title="Implementation highlights">
                <List items={project.highlights} />
              </Block>
            ) : null}
            {project.challenges.length ? (
              <Block icon={<TriangleAlert className="size-4" />} title="Challenges, limitations & solutions">
                <List items={project.challenges} />
              </Block>
            ) : null}
            {project.gallery.length ? (
              <Block icon={<Layers className="size-4" />} title="Screenshots">
                <div className="grid gap-4 sm:grid-cols-2">
                  {project.gallery.map((g) => (
                    <figure key={g.src} className="overflow-hidden rounded-xl border border-line bg-bg-elevated">
                      <a href={g.src} target="_blank" rel="noopener noreferrer" className="relative block aspect-[16/10]">
                        <Image
                          src={g.src}
                          alt={g.caption ?? `${project.title} screenshot`}
                          fill
                          sizes="(max-width: 640px) 100vw, 400px"
                          className="object-cover object-top transition hover:scale-[1.02]"
                          unoptimized={!isOptimizable(g.src)}
                        />
                      </a>
                      {g.caption ? <figcaption className="px-3 py-2 text-xs text-muted">{g.caption}</figcaption> : null}
                    </figure>
                  ))}
                </div>
              </Block>
            ) : null}
          </div>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
            <section className="card p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-subtle">Technology stack</h2>
              <ul className="flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <li key={t} className="rounded-lg border border-line bg-bg-elevated/60 px-2.5 py-1 font-mono text-xs text-fg">
                    {t}
                  </li>
                ))}
              </ul>
            </section>
            <section className="card space-y-4 p-6 text-sm">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">Status</h2>
                <p className="mt-1 text-fg">{project.status}</p>
              </div>
              {project.githubUrl ? (
                <div>
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">Repository</h2>
                  <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 break-all text-accent-1 hover:underline">
                    <GithubIcon className="size-4 shrink-0" /> {project.repo ?? "GitHub"}
                  </a>
                </div>
              ) : null}
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-subtle">Live demo</h2>
                {project.demoUrl ? (
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1.5 break-all text-accent-1 hover:underline">
                    <ExternalLink className="size-4 shrink-0" /> Open demo
                  </a>
                ) : (
                  <p className="mt-1 text-muted">Not publicly deployed</p>
                )}
              </div>
            </section>
            <Link
              href="/#contact"
              className="card block p-6 text-sm text-muted transition hover:border-line-strong"
            >
              <span className="block font-semibold text-fg">Interested in this project?</span>
              Get in touch to discuss it or something similar →
            </Link>
          </aside>
        </div>
      </div>
    </article>
  );
}

function ProjectSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-5 pb-24 pt-32 sm:px-8" aria-busy="true" aria-label="Loading project">
      <div className="skeleton h-4 w-28" />
      <div className="skeleton mt-8 h-6 w-40" />
      <div className="skeleton mt-4 h-12 w-3/4" />
      <div className="skeleton mt-4 h-5 w-full" />
      <div className="skeleton mt-2 h-5 w-2/3" />
      <div className="skeleton mt-10 aspect-[16/8] w-full rounded-2xl" />
      <div className="mt-10 grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="skeleton h-64" />
        <div className="skeleton h-40" />
      </div>
    </div>
  );
}
