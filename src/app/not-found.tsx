import Link from "next/link";
import { Compass } from "lucide-react";

export default function NotFound() {
  return (
    <main className="relative grid min-h-dvh place-items-center overflow-hidden px-6 text-center">
      <div aria-hidden="true" className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(circle_at_center,black,transparent_70%)]" />
      <div>
        <span className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl bg-gradient-accent text-white shadow-[0_16px_40px_-14px_var(--glow)]">
          <Compass className="size-8" aria-hidden="true" />
        </span>
        <p className="font-mono text-sm text-accent-2">404</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-fg sm:text-5xl">Page not found</h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-11 items-center rounded-xl bg-gradient-accent px-5 text-sm font-medium text-white">
            Back to home
          </Link>
          <Link href="/#projects" className="glass inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium text-fg">
            Browse projects
          </Link>
        </div>
      </div>
    </main>
  );
}
