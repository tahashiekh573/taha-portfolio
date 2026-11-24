"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { Project } from "@/lib/types";
import { ProjectCard, type RepoStat } from "@/components/site/project-card";
import { cn } from "@/lib/utils";

export function ProjectsExplorer({
  projects,
  stats,
}: {
  projects: Project[];
  stats: Record<string, RepoStat> | null;
}) {
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const categories = useMemo(() => {
    const present = new Set(projects.map((p) => p.category));
    return ["All", "Featured", ...[...present]];
  }, [projects]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter((p) => {
      if (category === "Featured" && !p.featured) return false;
      if (category !== "All" && category !== "Featured" && p.category !== category) return false;
      if (!q) return true;
      return [p.title, p.summary, p.category, ...p.tech].join(" ").toLowerCase().includes(q);
    });
  }, [projects, category, query]);

  const LIMIT = 9;
  const visible = showAll || query || category !== "All" ? filtered : filtered.slice(0, LIMIT);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter projects by category" className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              aria-pressed={category === c}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                category === c
                  ? "border-transparent bg-gradient-accent text-white"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {c}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Search projects</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or technology…"
            className="h-10 w-full rounded-xl border border-line-strong bg-bg-elevated/60 pl-10 pr-9 text-sm text-fg outline-none placeholder:text-subtle focus:border-accent-2"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-lg text-subtle hover:text-fg"
            >
              <X className="size-4" />
            </button>
          ) : null}
        </label>
      </div>

      <p className="sr-only" aria-live="polite">
        {filtered.length} projects shown
      </p>

      {visible.length ? (
        <motion.ul layout className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {visible.map((p, i) => (
              <motion.li
                layout
                key={p.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.3 }}
              >
                <ProjectCard project={p} stat={stats?.[(p.repo ?? "").toLowerCase()]} priority={i < 3} />
              </motion.li>
            ))}
          </AnimatePresence>
        </motion.ul>
      ) : (
        <p className="card p-10 text-center text-muted">No projects match your search.</p>
      )}

      {!showAll && !query && category === "All" && filtered.length > LIMIT ? (
        <div className="mt-10 text-center">
          <button
            type="button"
            onClick={() => setShowAll(true)}
            className="glass inline-flex h-11 items-center rounded-xl px-6 text-sm font-medium text-fg transition hover:-translate-y-0.5"
          >
            Show all {filtered.length} projects
          </button>
        </div>
      ) : null}
    </div>
  );
}
