"use client";

import { ArrowDown, ArrowUp, ImageUp, LoaderCircle, Plus, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------ API helper
export class UnauthorizedError extends Error {}

export async function api<T = unknown>(method: string, url: string, body?: unknown): Promise<T> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(url, {
    method,
    headers: body && !isForm ? { "Content-Type": "application/json" } : undefined,
    body: body ? (isForm ? (body as FormData) : JSON.stringify(body)) : undefined,
    credentials: "same-origin",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string } & T;
  if (res.status === 401) {
    window.location.replace("/admin/login");
    throw new UnauthorizedError("Session expired");
  }
  if (!res.ok || data.ok === false) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export async function uploadFile(file: File, folder: string): Promise<string> {
  const form = new FormData();
  form.append("file", file);
  form.append("folder", folder);
  const data = await api<{ url: string }>("POST", "/api/admin/upload", form);
  return data.url;
}

// ------------------------------------------------------------------ Layout
export function Panel({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="card p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-fg">{title}</h2>
          {description ? <p className="mt-1 max-w-2xl text-sm text-muted">{description}</p> : null}
        </div>
        {actions}
      </div>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

export function SaveBar({ saving, onSave, dirty }: { saving: boolean; onSave: () => void; dirty?: boolean }) {
  return (
    <div className="flex items-center justify-end gap-3 border-t border-line pt-5">
      {dirty ? <span className="text-xs text-amber-500">Unsaved changes</span> : null}
      <Button onClick={onSave} disabled={saving}>
        {saving ? <LoaderCircle className="animate-spin" /> : null}
        {saving ? "Saving…" : "Save changes"}
      </Button>
    </div>
  );
}

// ------------------------------------------------------------------ Fields
export function TextField({
  label,
  value,
  onChange,
  hint,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  hint?: string;
  type?: string;
  placeholder?: string;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} value={value ?? ""} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

export function AreaField({
  label,
  value,
  onChange,
  hint,
  rows = 4,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  hint?: string;
  rows?: number;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea id={id} rows={rows} value={value ?? ""} onChange={(e) => onChange(e.target.value)} className="min-h-0" />
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

/** Edits a string[] as one item per line. */
export function LinesField({
  label,
  value,
  onChange,
  hint = "One item per line",
  rows = 5,
}: {
  label: string;
  value: string[];
  onChange: (v: string[]) => void;
  hint?: string;
  rows?: number;
}) {
  const id = useId();
  const [text, setText] = useState(value.join("\n"));
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        rows={rows}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split("\n").map((s) => s.trim()).filter(Boolean));
        }}
        className="min-h-0 font-mono text-[13px]"
      />
      <p className="mt-1 text-xs text-subtle">{hint}</p>
    </div>
  );
}

/** Edits a string[] as comma-separated tags. */
export function TagsField({ label, value, onChange, hint }: { label: string; value: string[]; onChange: (v: string[]) => void; hint?: string }) {
  const id = useId();
  const [text, setText] = useState(value.join(", "));
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean));
        }}
      />
      <p className="mt-1 text-xs text-subtle">{hint ?? "Separate with commas"}</p>
    </div>
  );
}

export function SelectField<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: readonly T[] | { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  const opts = (options as readonly (T | { value: T; label: string })[]).map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <Select id={id} value={value} onChange={(e) => onChange(e.target.value as T)}>
        {opts.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}

export function Toggle({ label, checked, onChange, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; hint?: string }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 rounded-xl border border-line bg-bg-elevated/40 p-4">
      <div>
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
        {hint ? <p className="mt-0.5 text-xs text-subtle">{hint}</p> : null}
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition",
          checked ? "bg-gradient-accent" : "bg-line-strong",
        )}
      >
        <span className={cn("absolute top-0.5 size-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </button>
    </div>
  );
}

export function UploadField({
  label,
  value,
  onChange,
  folder,
  accept = "image/png,image/jpeg,image/webp,image/avif",
  kind = "image",
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (url: string) => void;
  folder: string;
  accept?: string;
  kind?: "image" | "pdf";
  hint?: string;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  async function onFile(file?: File) {
    if (!file) return;
    setBusy(true);
    try {
      const url = await uploadFile(file, folder);
      onChange(url);
      toast.success("Uploaded — remember to save");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {kind === "image" && value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-16 shrink-0 rounded-lg border border-line object-cover" />
        ) : null}
        <Input id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder="https://… or upload a file" />
        <input ref={input} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button type="button" variant="secondary" onClick={() => input.current?.click()} disabled={busy} className="shrink-0">
          {busy ? <LoaderCircle className="animate-spin" /> : kind === "image" ? <ImageUp /> : <Upload />}
          Upload
        </Button>
      </div>
      {hint ? <p className="mt-1 text-xs text-subtle">{hint}</p> : null}
    </div>
  );
}

// ------------------------------------------------------------------ Repeatable items
export function ItemList<T>({
  items,
  onChange,
  render,
  title,
  create,
  addLabel = "Add item",
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (patch: Partial<T>) => void, index: number) => ReactNode;
  title: (item: T) => string;
  create: () => T;
  addLabel?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(open === i ? j : open);
  };
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-line bg-bg-elevated/40">
          <div className="flex items-center gap-2 p-3">
            <button
              type="button"
              className="flex-1 truncate text-left text-sm font-medium text-fg"
              onClick={() => setOpen(open === i ? null : i)}
              aria-expanded={open === i}
            >
              {title(item) || "Untitled"}
            </button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => move(i, -1)} aria-label="Move up" disabled={i === 0}>
              <ArrowUp />
            </Button>
            <Button size="icon" variant="ghost" className="size-8" onClick={() => move(i, 1)} aria-label="Move down" disabled={i === items.length - 1}>
              <ArrowDown />
            </Button>
            <ConfirmButton onConfirm={() => onChange(items.filter((_, k) => k !== i))} label="Remove" />
          </div>
          {open === i ? (
            <div className="space-y-4 border-t border-line p-4">
              {render(item, (patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it))), i)}
            </div>
          ) : null}
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => {
          onChange([...items, create()]);
          setOpen(items.length);
        }}
      >
        <Plus /> {addLabel}
      </Button>
    </div>
  );
}

export function ConfirmButton({ onConfirm, label = "Delete" }: { onConfirm: () => void; label?: string }) {
  const [armed, setArmed] = useState(false);
  if (armed) {
    return (
      <span className="flex items-center gap-1">
        <Button size="sm" variant="danger" className="h-8" onClick={() => { setArmed(false); onConfirm(); }}>
          Confirm
        </Button>
        <Button size="sm" variant="ghost" className="h-8" onClick={() => setArmed(false)}>
          Cancel
        </Button>
      </span>
    );
  }
  return (
    <Button size="icon" variant="ghost" className="size-8 hover:text-red-500" onClick={() => setArmed(true)} aria-label={label}>
      <Trash2 />
    </Button>
  );
}
