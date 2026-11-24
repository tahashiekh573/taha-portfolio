"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export function BackToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 700);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      type="button"
      aria-label="Back to top"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "glass fixed bottom-6 right-6 z-40 grid size-11 place-items-center rounded-xl text-fg transition-all duration-300 hover:-translate-y-1",
        show ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}
      tabIndex={show ? 0 : -1}
    >
      <ArrowUp className="size-4" />
    </button>
  );
}
