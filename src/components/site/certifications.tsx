import { Award, BadgeCheck, ExternalLink, FileText } from "lucide-react";
import Image from "next/image";
import type { Certification } from "@/lib/types";
import { Section } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { isOptimizable } from "@/lib/utils";

export function Certifications({ items }: { items: Certification[] }) {
  const verified = items.filter((c) => c.verified);
  if (!verified.length) return null;
  return (
    <Section id="certifications" eyebrow="Certifications" title="Courses & certifications">
      <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {verified.map((c, i) => (
          <li key={c.id}>
            <Reveal delay={i * 0.04} className="card flex h-full flex-col overflow-hidden transition hover:-translate-y-1 hover:border-line-strong">
              {c.imageUrl ? (
                <div className="relative aspect-[4/3] bg-bg-elevated">
                  <Image
                    src={c.imageUrl}
                    alt={`${c.title} certificate`}
                    fill
                    sizes="(max-width: 640px) 100vw, 360px"
                    className="object-contain p-2"
                    unoptimized={!isOptimizable(c.imageUrl)}
                  />
                </div>
              ) : null}
              <div className="flex flex-1 flex-col p-6">
                <span className="mb-4 inline-grid size-10 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--accent-2)_16%,transparent)] text-accent-2">
                  <Award className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold leading-snug text-fg">{c.title}</h3>
                <p className="mt-1 text-sm text-muted">{c.issuer}</p>
                {c.date ? <p className="mt-1 text-xs text-subtle">{c.date}</p> : null}
                <div className="mt-auto flex flex-wrap gap-3 pt-5 text-sm">
                  {c.credentialUrl ? (
                    <a
                      href={c.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-accent-1 hover:underline"
                    >
                      <BadgeCheck className="size-4" aria-hidden="true" /> Verify <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  ) : null}
                  {c.pdfUrl ? (
                    <a
                      href={c.pdfUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 font-medium text-muted hover:text-fg"
                    >
                      <FileText className="size-4" aria-hidden="true" /> Certificate (PDF)
                    </a>
                  ) : null}
                </div>
              </div>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
