import Image from "next/image";
import type { Project } from "@/lib/types";
import { Icon } from "@/components/site/icon";
import { cn, isOptimizable } from "@/lib/utils";

/** A real screenshot when one exists, otherwise a designed cover (never a fake screenshot). */
export function ProjectCover({
  project,
  className,
  sizes = "(max-width: 768px) 100vw, 400px",
  priority,
}: {
  project: Pick<Project, "title" | "thumbnail" | "coverIcon" | "category">;
  className?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (project.thumbnail) {
    // SVG covers are designed illustrations (not screenshots) and are served as-is.
    const isSvg = /\.svg(\?|$)/i.test(project.thumbnail);
    return (
      <div className={cn("relative overflow-hidden bg-bg-elevated", className)}>
        <Image
          src={project.thumbnail}
          alt={`${project.title} ${isSvg ? "illustration" : "screenshot"}`}
          fill
          sizes={sizes}
          priority={priority}
          className={cn(
            "object-cover transition duration-500 group-hover:scale-[1.03]",
            isSvg ? "object-center" : "object-top",
          )}
          unoptimized={isSvg || !isOptimizable(project.thumbnail)}
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative grid place-items-center overflow-hidden bg-[linear-gradient(135deg,color-mix(in_oklab,var(--accent-1)_22%,var(--bg-elevated)),color-mix(in_oklab,var(--accent-2)_26%,var(--bg-elevated)))]",
        className,
      )}
      role="img"
      aria-label={`${project.title} cover`}
    >
      <div aria-hidden="true" className="bg-grid absolute inset-0 opacity-70 [mask-image:radial-gradient(circle_at_center,black,transparent_75%)]" />
      <div aria-hidden="true" className="absolute size-40 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-xl" />
      <div className="relative flex flex-col items-center gap-3 px-6 text-center">
        <span className="grid size-14 place-items-center rounded-2xl border border-white/15 bg-white/10 text-white shadow-lg backdrop-blur transition duration-500 group-hover:scale-110 dark:text-white">
          <Icon name={project.coverIcon} className="size-7 text-fg" />
        </span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{project.category}</span>
      </div>
    </div>
  );
}
