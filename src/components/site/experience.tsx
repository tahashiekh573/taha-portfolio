import { Building2, MapPin } from "lucide-react";
import type { Experience as ExperienceT } from "@/lib/types";
import { Section } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";

export function Experience({ items }: { items: ExperienceT[] }) {
  const visible = items.filter((e) => e.published);
  if (!visible.length) return null;
  return (
    <Section
      id="experience"
      eyebrow="Experience"
      title="Where I've worked"
      description="Professional experience across enterprise service management, software engineering and applied AI."
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
                  {e.period ? <Badge>{e.period}</Badge> : null}
                </div>
              </div>
              {e.location ? (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-subtle">
                  <MapPin className="size-3.5" aria-hidden="true" /> {e.location}
                </p>
              ) : null}
              {e.summary ? <p className="mt-4 text-sm leading-relaxed text-muted">{e.summary}</p> : null}
              {e.points.length ? (
                <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                  {e.points.map((p) => (
                    <li key={p} className="flex gap-2.5 text-sm text-muted">
                      <span className="mt-2 size-1.5 shrink-0 rounded-full bg-accent-2" aria-hidden="true" />
                      {p}
                    </li>
                  ))}
                </ul>
              ) : null}
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
