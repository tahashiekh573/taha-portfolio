import type { About as AboutT } from "@/lib/types";
import { Section } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { Icon } from "@/components/site/icon";

export function About({ about, githubRepos }: { about: AboutT; githubRepos: number | null }) {
  const highlights = [...about.highlights];
  if (githubRepos) highlights.push({ label: "Public GitHub repositories", value: String(githubRepos) });
  return (
    <Section id="about" eyebrow="About me" title={about.headline}>
      <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
        <Reveal className="space-y-5 text-base leading-relaxed text-muted sm:text-[17px]">
          {about.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </Reveal>
        <Reveal delay={0.1}>
          <dl className="card grid grid-cols-2 gap-px overflow-hidden p-0">
            {highlights.map((h) => (
              <div key={h.label} className="bg-surface p-5">
                <dt className="text-xs uppercase tracking-wider text-subtle">{h.label}</dt>
                <dd className="mt-2 text-sm font-semibold text-fg sm:text-base">{h.value}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>

      <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {about.focusAreas.map((f, i) => (
          <li key={f.title}>
            <Reveal delay={i * 0.05} className="card group h-full p-6 transition duration-300 hover:-translate-y-1 hover:border-line-strong hover:glow-ring">
              <span className="mb-4 inline-grid size-11 place-items-center rounded-xl bg-gradient-accent text-white shadow-[0_10px_24px_-10px_var(--glow)]">
                <Icon name={f.icon} className="size-5" />
              </span>
              <h3 className="text-base font-semibold text-fg">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.description}</p>
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  );
}
