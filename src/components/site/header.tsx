"use client";

import { AnimatePresence, motion, useScroll, useSpring } from "motion/react";
import { Download, Menu, Moon, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useEffect, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";

export type NavItem = { id: string; label: string };

const emptySubscribe = () => () => {};
function useMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useMounted();
  const dark = !mounted || resolvedTheme !== "light";
  return (
    <button
      type="button"
      onClick={() => setTheme(dark ? "light" : "dark")}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl text-muted transition hover:bg-surface hover:text-fg",
        className,
      )}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}

type HeaderProps = { items: NavItem[]; hasResume: boolean };

/** usePathname() is request data, so it sits behind Suspense; the fallback is the same header. */
export function Header(props: HeaderProps) {
  return (
    <Suspense fallback={<HeaderView {...props} isHome={false} />}>
      <HeaderWithPath {...props} />
    </Suspense>
  );
}

function HeaderWithPath(props: HeaderProps) {
  const pathname = usePathname();
  return <HeaderView {...props} isHome={pathname === "/"} />;
}

function HeaderView({ items, hasResume, isHome }: HeaderProps & { isHome: boolean }) {
  const [active, setActive] = useState("home");
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!isHome) return;
    const sections = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => Boolean(el));
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [isHome, items]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const href = (id: string) => (id === "home" ? "/#home" : `/#${id}`);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "glass border-x-0 border-t-0 shadow-[0_10px_40px_-25px_rgba(0,0,0,0.6)]" : "border-b border-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-bg-elevated focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" className="group flex items-center gap-2 font-semibold tracking-tight" aria-label="Taha.dev home">
          <span className="grid size-8 place-items-center rounded-lg bg-gradient-accent text-sm font-bold text-white shadow-[0_8px_24px_-8px_var(--glow)]">
            T
          </span>
          <span className="text-lg">
            Taha<span className="text-gradient">.dev</span>
          </span>
        </Link>

        <ul className="hidden items-center gap-0.5 lg:flex">
          {items.map((item) => {
            const isActive = isHome && active === item.id;
            return (
              <li key={item.id}>
                <a
                  href={href(item.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    "relative rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive ? "text-fg" : "text-muted hover:text-fg",
                  )}
                >
                  {isActive ? (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 -z-10 rounded-lg bg-surface ring-1 ring-line"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  ) : null}
                  {item.label}
                </a>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-1.5">
          {hasResume ? (
            <a
              href="/resume?download"
              className="hidden h-9 items-center gap-2 rounded-xl bg-gradient-accent px-3.5 text-sm font-medium text-white transition hover:brightness-110 sm:inline-flex"
            >
              <Download className="size-4" /> Resume
            </a>
          ) : null}
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-xl text-fg hover:bg-surface lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-menu"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <motion.div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-[2px] origin-left bg-gradient-accent"
        style={{ scaleX: progress }}
      />

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass fixed inset-x-0 top-16 bottom-0 overflow-y-auto border-x-0 px-5 pb-10 pt-4 lg:hidden"
          >
            <ul className="flex flex-col gap-1">
              {items.map((item) => (
                <li key={item.id}>
                  <a
                    href={href(item.id)}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-xl px-4 py-3 text-base",
                      isHome && active === item.id ? "bg-surface text-fg ring-1 ring-line" : "text-muted",
                    )}
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
            {hasResume ? (
              <a
                href="/resume?download"
                className="mt-6 flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-accent font-medium text-white"
              >
                <Download className="size-4" /> Download Resume
              </a>
            ) : null}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
