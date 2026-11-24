import { ArrowUpRight, GraduationCap } from "lucide-react";
import Link from "next/link";
import type { Education as EducationT } from "@/lib/types";
import { Section } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { Badge } from "@/components/ui/badge";

export function Education({ items, projectSlugs }: { items: EducationT[]; projectSlugs: string[] }) {
  if (!items.length) return null;
  return (
    <Section id="education" eyebrow="Education" title="Academic foundation">
      <div className="space-y-6">
        {items.map((e) => {
          const fyp = e.finalProject;
          const linkable = fyp?.projectSlug && projectSlugs.includes(fyp.projectSlug);
          return (
            <Reveal key={e.id} className="card gradient-border relative overflow-hidden p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-gradient-accent text-white shadow-[0_12px_30px_-12px_var(--glow)]">
                  <GraduationCap className="size-7" aria-hidden="true" />
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-semibold text-fg">{e.degree}</h3>
                      <p className="mt-1 text-muted">
                        {e.institution}
                        {e.location ? `, ${e.location}` : ""}
                      </p>
                    </div>
                    <Badge className="text-sm">{e.period}</Badge>
                  </div>
                  {e.subjects.length ? (
                    <div className="mt-6">
                      <h4 className="mb-3 text-xs font-medium uppercase tracking-wider text-subtle">Relevant coursework</h4>
                      <ul className="flex flex-wrap gap-2">
                        {e.subjects.map((s) => (
                          <li key={s}>
                            <Badge className="px-3 py-1.5 text-[13px] text-fg">{s}</Badge>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                  {fyp ? (
                    <div className="mt-6 rounded-xl border border-line bg-bg-elevated/50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-subtle">Final year project</p>
                      {linkable ? (
                        <Link
                          href={`/projects/${fyp.projectSlug}`}
                          className="group mt-1 inline-flex items-center gap-1.5 font-semibold text-fg hover:text-accent-1"
                        >
                          {fyp.title}
                          <ArrowUpRight className="size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                        </Link>
                      ) : (
                        <p className="mt-1 font-semibold text-fg">{fyp.title}</p>
                      )}
                    </div>
                  ) : null}
                  {e.notes ? <p className="mt-4 text-sm text-muted">{e.notes}</p> : null}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
