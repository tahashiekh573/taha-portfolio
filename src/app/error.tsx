"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <main className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <h1 className="text-3xl font-semibold text-fg">Something went wrong</h1>
        <p className="mx-auto mt-3 max-w-md text-muted">An unexpected error occurred while loading this page.</p>
        <div className="mt-8 flex justify-center gap-3">
          <button onClick={reset} className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-accent px-5 text-sm font-medium text-white">
            <RefreshCw className="size-4" /> Try again
          </button>
          <Link href="/" className="glass inline-flex h-11 items-center rounded-xl px-5 text-sm font-medium text-fg">
            Home
          </Link>
        </div>
      </div>
    </main>
  );
}
