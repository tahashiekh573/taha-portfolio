import { Building2, ChevronDown, MapPin, TrendingUp } from "lucide-react";
import type { Experience as ExperienceT } from "@/lib/types";
import { Section } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";

function Bullets({ points }: { points: string[] }) {
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {points.map((p) => (
        <li key={p} className="flex gap-2.5 text-sm text-muted">
          <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden="true" />
          {p}
        </li>
      ))}
    </ul>
  );
}

/** Short items (tools, services) read better as chips than as bullets. */
function Chips({ points }: { points: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {points.map((p) => (
        <li key={p} className="rounded-lg bg-bg-elevated/70 px-2.5 py-1 text-xs font-medium text-muted ring-1 ring-line">
          {p}
        </li>
      ))}
    </ul>
  );
}

function Metrics({ e }: { e: ExperienceT }) {
  const metrics = e.metrics ?? [];
  if (!metrics.length) return null;
  const pct = (v: string) => {
    const m = v.match(/^\s*([\d.]+)\s*\/\s*([\d.]+)/);
    return m ? Math.round((Number(m[1]) / Number(m[2])) * 100) : null;
  };
  return (
    <div className="mt-5 rounded-xl border border-line bg-bg-elevated/50 p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-fg">{e.metricsTitle ?? "Performance"}</p>
        {e.metricsNote ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[color-mix(in_oklab,var(--success)_14%,transparent)] px-2.5 py-1 text-xs font-semibold text-[var(--success)]">
            <TrendingUp className="size-3.5" aria-hidden="true" /> {e.metricsNote}
          </span>
        ) : null}
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {metrics.map((m) => {
          const p = pct(m.value);
          return (
            <li key={m.label}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-subtle">{m.label}</span>
                <span className="font-mono text-sm font-semibold text-fg">{m.value}</span>
              </div>
              {p !== null ? (
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line" aria-hidden="true">
                  <div className="h-full rounded-full bg-gradient-accent" style={{ width: `${p}%` }} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function Experience({ items }: { items: ExperienceT[] }) {
  const visible = items.filter((e) => e.published);
  if (!visible.length) return null;
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Where I've worked"
      description="Professional experience across Atlassian engineering, applied AI/ML, software engineering and quality assurance."
    >
      <ol className="relative space-y-6 border-l border-line pl-6 sm:pl-10">
        {visible.map((e, i) => (
          <li key={e.id} className="relative">
            <span
              aria-hidden="true"
              className="absolute -left-[31px] top-7 size-3.5 rounded-full border-2 border-bg bg-gradient-accent ring-4 ring-[color-mix(in_oklab,var(--accent-2)_20%,transparent)] sm:-left-[47px]"
            />
            <Reveal delay={i * 0.05} className="card p-6 sm:p-7">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-fg">
                    <Building2 className="size-4 text-accent-2" aria-hidden="true" />
                    {e.company}
                  </h3>
                  <p className="mt-1 text-sm font-medium text-accent-1">{e.role}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {e.type ? <Badge>{e.type}</Badge> : null}
                  {e.period ? (
                    <Badge className={e.period === "Present" ? "border-transparent bg-[color-mix(in_oklab,var(--success)_14%,transparent)] text-[var(--success)]" : undefined}>
                      {e.period === "Present" ? (
                        <span className="size-1.5 rounded-full bg-[var(--success)] animate-pulse-dot" aria-hidden="true" />
                      ) : null}
                      {e.period}
                    </Badge>
                  ) : null}
                </div>
              </div>
              {e.location ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
                  <MapPin className="size-3.5" aria-hidden="true" /> {e.location}
                </p>
              ) : null}
              {e.summary ? <p className="mt-4 text-sm leading-relaxed text-muted">{e.summary}</p> : null}
              {e.points.length ? (
                <div className="mt-4">
                  <Bullets points={e.points} />
                </div>
              ) : null}

              {e.groups?.length ? (
                <div className="mt-5 space-y-3">
                  {e.groups.map((g, gi) => {
                    const chips = g.points.every((p) => p.length <= 36);
                    return (
                      <details
                        key={g.title}
                        open={gi === 0}
                        className="group/g rounded-xl border border-line bg-bg-elevated/40 open:bg-bg-elevated/60"
                      >
                        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden">
                          <span>
                            {g.title}
                            <span className="ml-2 font-mono text-xs font-normal text-subtle">{g.points.length}</span>
                          </span>
                          <ChevronDown className="size-4 text-subtle transition group-open/g:rotate-180" aria-hidden="true" />
                        </summary>
                        <div className="px-4 pb-4">{chips ? <Chips points={g.points} /> : <Bullets points={g.points} />}</div>
                      </details>
                    );
                  })}
                </div>
              ) : null}

              <Metrics e={e} />

              {e.tech.length ? (
                <div className="mt-5 flex flex-wrap gap-1.5">
                  {e.tech.map((t) => (
                    <Badge key={t}>{t}</Badge>
                  ))}
                </div>
              ) : null}
            </Reveal>
          </li>
        ))}
      </ol>
    </Section>
  );
}
