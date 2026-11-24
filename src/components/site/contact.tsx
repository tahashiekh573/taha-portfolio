import { Mail, MessageCircle, Phone } from "lucide-react";
import type { Profile } from "@/lib/types";
import { Section } from "@/components/site/section";
import { Reveal } from "@/components/site/reveal";
import { ContactForm } from "@/components/site/contact-form";
import { GithubIcon, LinkedinIcon } from "@/components/site/brand-icons";
import { whatsappLink } from "@/lib/utils";

export function Contact({ profile, formEnabled }: { profile: Profile; formEnabled: boolean }) {
  const channels = [
    { label: "Email me", value: profile.email, href: `mailto:${profile.email}`, icon: <Mail className="size-5" /> },
    { label: "Call me", value: profile.phoneDisplay, href: `tel:${profile.phone}`, icon: <Phone className="size-5" /> },
    {
      label: "WhatsApp me",
      value: "Chat on WhatsApp",
      href: whatsappLink(profile.whatsapp, profile.whatsappMessage),
      icon: <MessageCircle className="size-5" />,
      external: true,
    },
    { label: "LinkedIn", value: "Connect with me", href: profile.linkedin, icon: <LinkedinIcon className="size-5" />, external: true },
    { label: "GitHub", value: `@${profile.githubUsername}`, href: profile.github, icon: <GithubIcon className="size-5" />, external: true },
  ];

  return (
    <Section
      id="contact"
      eyebrow="Contact"
      title={
        <>
          Let&apos;s build something <span className="text-gradient">useful</span> together
        </>
      }
      description="Recruiters, clients and collaborators are welcome. Send a message below or reach me directly — I usually reply within a day or two."
    >
      <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <Reveal>
          <ul className="space-y-3">
            {channels.map((c) => (
              <li key={c.label}>
                <a
                  href={c.href}
                  {...(c.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="card group flex items-center gap-4 p-4 transition hover:-translate-y-0.5 hover:border-line-strong"
                >
                  <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-[color-mix(in_oklab,var(--accent-1)_14%,transparent)] text-accent-1 transition group-hover:bg-gradient-accent group-hover:text-white">
                    {c.icon}
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-fg">{c.label}</span>
                    <span className="block truncate text-sm text-muted">{c.value}</span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <ContactForm email={profile.email} enabled={formEnabled} />
        </Reveal>
      </div>
    </Section>
  );
}
