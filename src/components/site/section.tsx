import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Reveal } from "@/components/site/reveal";

export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className={cn("relative py-20 sm:py-28", className)}>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Reveal className="mb-12 max-w-2xl">
          <p className="mb-3 font-mono text-xs font-medium uppercase tracking-[0.2em] text-accent-2">
            {eyebrow}
          </p>
          <h2 id={`${id}-title`} className="text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
            {title}
          </h2>
          {description ? <p className="mt-4 text-base leading-relaxed text-muted">{description}</p> : null}
        </Reveal>
        {children}
      </div>
    </section>
  );
}
