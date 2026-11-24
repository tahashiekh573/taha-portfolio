"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowRight, Briefcase, Download, Mail, MapPin } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import type { Profile } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { GithubIcon, LinkedinIcon } from "@/components/site/brand-icons";
import { cn, isOptimizable } from "@/lib/utils";

const AVAILABILITY = {
  available: "bg-emerald-400",
  open: "bg-sky-400",
  unavailable: "bg-zinc-400",
} as const;

export function prefillContact(subject: string) {
  window.dispatchEvent(new CustomEvent("contact:prefill", { detail: { subject } }));
}

export function Hero({ profile, hasResume }: { profile: Profile; hasResume: boolean }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce || profile.titles.length < 2) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % profile.titles.length), 2600);
    return () => clearInterval(t);
  }, [reduce, profile.titles.length]);

  const fade = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 16 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
        };

  return (
    <section id="home" aria-label="Introduction" className="relative overflow-hidden pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Background */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-grid absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_30%,transparent_75%)]" />
        <div className="absolute -top-40 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent-1)_28%,transparent),transparent)] blur-2xl" />
        <div className="absolute top-40 -right-40 h-[420px] w-[420px] rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--accent-2)_26%,transparent),transparent)] blur-2xl" />
      </div>

      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="order-2 lg:order-1">
          <motion.div {...fade(0)} className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-line bg-surface px-3.5 py-1.5 text-xs font-medium text-muted backdrop-blur">
            <span
              className={cn(
                "size-2 rounded-full",
                AVAILABILITY[profile.availability],
                profile.availability !== "unavailable" && "animate-pulse-dot",
              )}
              aria-hidden="true"
            />
            {profile.availabilityText}
          </motion.div>

          <motion.p {...fade(0.05)} className="text-lg text-muted">
            {profile.greeting}
          </motion.p>
          <motion.h1
            {...fade(0.1)}
            className="mt-2 text-5xl font-semibold leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl"
          >
            <span className="text-gradient">{profile.name}</span>
          </motion.h1>

          <motion.div {...fade(0.18)} className="mt-5 flex h-9 items-center text-xl font-medium text-fg sm:text-2xl" aria-live="polite">
            <span className="mr-3 h-px w-8 bg-gradient-accent" aria-hidden="true" />
            <span className="relative inline-block min-w-[16ch]">
              <AnimatePresence mode="wait">
                <motion.span
                  key={profile.titles[index]}
                  initial={reduce ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={reduce ? undefined : { opacity: 0, y: -10, filter: "blur(4px)" }}
                  transition={{ duration: 0.35 }}
                  className="inline-block"
                >
                  {profile.titles[index]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.div>

          <motion.p {...fade(0.25)} className="mt-6 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
            {profile.intro}
          </motion.p>

          <motion.p {...fade(0.3)} className="mt-5 flex items-center gap-2 text-sm text-subtle">
            <MapPin className="size-4" aria-hidden="true" /> {profile.location}
          </motion.p>

          <motion.div {...fade(0.36)} className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="md">
              <a href="#projects">
                View My Projects <ArrowRight />
              </a>
            </Button>
            <Button asChild size="md" variant="secondary">
              <a href="#contact" onClick={() => prefillContact("Hiring inquiry")}>
                <Briefcase /> Hire Me
              </a>
            </Button>
            {hasResume ? (
              <Button asChild size="md" variant="outline">
                <a href="/resume?download">
                  <Download /> Download Resume
                </a>
              </Button>
            ) : null}
            <Button asChild size="md" variant="ghost">
              <a href="#contact">
                <Mail /> Contact Me
              </a>
            </Button>
          </motion.div>

          <motion.div {...fade(0.42)} className="mt-8 flex items-center gap-2">
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="GitHub profile"
              className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-line-strong hover:text-fg"
            >
              <GithubIcon className="size-[18px]" />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn profile"
              className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-line-strong hover:text-fg"
            >
              <LinkedinIcon className="size-[17px]" />
            </a>
            <a
              href={`mailto:${profile.email}`}
              aria-label="Send an email"
              className="grid size-10 place-items-center rounded-xl border border-line text-muted transition hover:border-line-strong hover:text-fg"
            >
              <Mail className="size-[18px]" />
            </a>
          </motion.div>
        </div>

        {/* Photo */}
        <motion.div
          className="order-1 mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:order-2"
          initial={reduce ? false : { opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="relative aspect-square">
            <div
              aria-hidden="true"
              className="animate-spin-slow absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,var(--accent-1),transparent_30%,var(--accent-2)_55%,transparent_80%,var(--accent-1))] opacity-70 blur-[2px]"
            />
            <div aria-hidden="true" className="absolute -inset-10 rounded-full bg-[radial-gradient(closest-side,var(--glow),transparent)] blur-2xl" />
            <div className="relative size-full overflow-hidden rounded-full border-4 border-bg bg-bg-elevated">
              <Image
                src={profile.photoUrl}
                alt={profile.photoAlt}
                fill
                priority
                sizes="(max-width: 640px) 340px, 400px"
                className="object-cover"
                style={{ objectPosition: profile.photoPosition }}
                unoptimized={!isOptimizable(profile.photoUrl)}
              />
            </div>
            {profile.techBadges.slice(0, 5).map((badge, i) => (
              <span
                key={badge}
                className={cn(
                  "glass absolute hidden whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-medium text-fg shadow-lg sm:inline-block",
                  !reduce && "animate-float",
                  BADGE_POSITIONS[i],
                )}
                style={{ animationDelay: `${i * 0.8}s` }}
              >
                {badge}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

const BADGE_POSITIONS = [
  "-left-6 top-10",
  "-right-4 top-6",
  "-right-8 bottom-24",
  "-left-10 bottom-16",
  "left-1/2 -bottom-4 -translate-x-1/2",
];

