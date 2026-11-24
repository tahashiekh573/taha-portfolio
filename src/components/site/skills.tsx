"use client";

import { Search, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import type { SkillCategory } from "@/lib/types";
import { Icon } from "@/components/site/icon";
import { cn } from "@/lib/utils";

export function SkillsExplorer({ categories }: { categories: SkillCategory[] }) {
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<string>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return categories
      .filter((c) => active === "all" || c.id === active)
      .map((c) => ({ ...c, skills: q ? c.skills.filter((s) => s.toLowerCase().includes(q)) : c.skills }))
      .filter((c) => c.skills.length);
  }, [categories, query, active]);

  const total = filtered.reduce((n, c) => n + c.skills.length, 0);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label="Filter skills by category" className="flex flex-wrap gap-2">
          {[{ id: "all", name: "All" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setActive(c.id)}
              aria-pressed={active === c.id}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-xs font-medium transition",
                active === c.id
                  ? "border-transparent bg-gradient-accent text-white"
                  : "border-line bg-surface text-muted hover:border-line-strong hover:text-fg",
              )}
            >
              {c.name}
            </button>
          ))}
        </div>
        <label className="relative block w-full lg:w-72">
          <span className="sr-only">Search skills</span>
          <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-subtle" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
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
        {total} skills shown
      </p>

      {filtered.length ? (
        <motion.div layout className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filtered.map((c) => (
              <motion.div
                layout
                key={c.id}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.25 }}
                className="card p-6 transition hover:border-line-strong"
              >
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] text-accent-2">
                    <Icon name={c.icon} className="size-[18px]" />
                  </span>
                  <h3 className="font-semibold text-fg">{c.name}</h3>
                </div>
                <ul className="flex flex-wrap gap-2">
                  {c.skills.map((s) => (
                    <li
                      key={s}
                      className="rounded-lg border border-line bg-bg-elevated/60 px-2.5 py-1 text-[13px] text-muted transition hover:border-accent-2/50 hover:text-fg"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <p className="card p-10 text-center text-muted">No skills match “{query}”.</p>
      )}
    </div>
  );
}
