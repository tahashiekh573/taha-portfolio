import { Mail } from "lucide-react";
import type { Profile } from "@/lib/types";
import { GithubIcon, LinkedinIcon } from "@/components/site/brand-icons";
import { CurrentYear } from "@/components/site/year";

export function Footer({ profile }: { profile: Profile }) {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-10 text-sm text-subtle sm:flex-row sm:px-8">
        <p>
          © <CurrentYear /> {profile.name}. Built with Next.js & Tailwind CSS.
        </p>
        <div className="flex items-center gap-1">
          <a href={profile.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub" className="grid size-9 place-items-center rounded-lg hover:bg-surface hover:text-fg">
            <GithubIcon className="size-4" />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="grid size-9 place-items-center rounded-lg hover:bg-surface hover:text-fg">
            <LinkedinIcon className="size-4" />
          </a>
          <a href={`mailto:${profile.email}`} aria-label="Email" className="grid size-9 place-items-center rounded-lg hover:bg-surface hover:text-fg">
            <Mail className="size-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
