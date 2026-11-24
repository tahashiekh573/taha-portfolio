import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const base =
  "w-full rounded-xl border border-line-strong bg-bg-elevated/60 px-4 text-sm text-fg placeholder:text-subtle outline-none transition focus:border-accent-2 focus:ring-4 focus:ring-[color-mix(in_oklab,var(--accent-2)_18%,transparent)] aria-[invalid=true]:border-red-500";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(base, "h-11", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(base, "min-h-32 py-3", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(base, "h-11 pr-8", className)} {...props} />;
}

export function Label({ className, ...props }: ComponentProps<"label">) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-fg", className)} {...props} />;
}
