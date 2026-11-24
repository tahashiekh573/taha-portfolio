"use client";

import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Textarea } from "@/components/ui/input";

type Fields = { name: string; email: string; subject: string; message: string };
type Errors = Partial<Record<keyof Fields, string>>;
const EMPTY: Fields = { name: "", email: "", subject: "", message: "" };

function validate(f: Fields): Errors {
  const e: Errors = {};
  if (f.name.trim().length < 2) e.name = "Please enter your name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim())) e.email = "Please enter a valid email";
  if (f.subject.trim().length < 3) e.subject = "Please add a subject";
  if (f.message.trim().length < 10) e.message = "Message should be at least 10 characters";
  return e;
}

export function ContactForm({ email, enabled }: { email: string; enabled: boolean }) {
  const [fields, setFields] = useState<Fields>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [serverError, setServerError] = useState("");
  const startedAt = useRef<number>(0);
  const honeypot = useRef<HTMLInputElement>(null);
  const subjectRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    startedAt.current = Date.now();
    const onPrefill = (e: Event) => {
      const subject = (e as CustomEvent<{ subject: string }>).detail?.subject;
      if (subject) setFields((f) => ({ ...f, subject: f.subject || subject }));
    };
    window.addEventListener("contact:prefill", onPrefill);
    return () => window.removeEventListener("contact:prefill", onPrefill);
  }, []);

  const set = (k: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFields((f) => ({ ...f, [k]: e.target.value }));
    if (errors[k]) setErrors((er) => ({ ...er, [k]: undefined }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");
    const errs = validate(fields);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`contact-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setState("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, website: honeypot.current?.value ?? "", startedAt: startedAt.current }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        fieldErrors?: Partial<Record<keyof Fields, string[]>>;
      };
      if (!res.ok || !data.ok) {
        if (data.fieldErrors) {
          setErrors(
            Object.fromEntries(Object.entries(data.fieldErrors).map(([k, v]) => [k, v?.[0]])) as Errors,
          );
        }
        throw new Error(data.error || "Something went wrong. Please try again.");
      }
      setState("sent");
      setFields(EMPTY);
      toast.success("Message sent! I'll get back to you soon.");
    } catch (err) {
      setState("idle");
      const msg = (err as Error).message;
      setServerError(msg);
      toast.error(msg);
    }
  }

  if (state === "sent") {
    return (
      <div className="card flex flex-col items-center justify-center gap-4 p-10 text-center" role="status">
        <span className="grid size-14 place-items-center rounded-full bg-[color-mix(in_oklab,var(--success)_18%,transparent)] text-success">
          <CircleCheck className="size-7" aria-hidden="true" />
        </span>
        <h3 className="text-xl font-semibold text-fg">Thank you — your message was sent.</h3>
        <p className="max-w-sm text-sm text-muted">I&apos;ll reply to the email address you provided as soon as I can.</p>
        <Button
          variant="secondary"
          onClick={() => {
            startedAt.current = Date.now();
            setState("idle");
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  const field = (k: keyof Fields) => ({
    id: `contact-${k}`,
    name: k,
    value: fields[k],
    onChange: set(k),
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? `contact-${k}-error` : undefined,
    disabled: !enabled || state === "sending",
  });
  const err = (k: keyof Fields) =>
    errors[k] ? (
      <p id={`contact-${k}-error`} className="mt-1.5 text-xs text-red-500">
        {errors[k]}
      </p>
    ) : null;

  return (
    <form onSubmit={onSubmit} noValidate className="card space-y-5 p-6 sm:p-8" aria-label="Contact form">
      {!enabled ? (
        <p className="rounded-xl border border-line bg-bg-elevated/60 p-3 text-sm text-muted">
          The contact form is temporarily unavailable. Please email{" "}
          <a className="text-accent-1 underline" href={`mailto:${email}`}>
            {email}
          </a>
          .
        </p>
      ) : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <Label htmlFor="contact-name">Full name</Label>
          <Input {...field("name")} autoComplete="name" placeholder="Your name" required maxLength={100} />
          {err("name")}
        </div>
        <div>
          <Label htmlFor="contact-email">Email address</Label>
          <Input {...field("email")} type="email" autoComplete="email" placeholder="you@company.com" required maxLength={200} />
          {err("email")}
        </div>
      </div>
      <div>
        <Label htmlFor="contact-subject">Subject</Label>
        <Input {...field("subject")} ref={subjectRef} placeholder="Project, role or question" required maxLength={150} />
        {err("subject")}
      </div>
      <div>
        <Label htmlFor="contact-message">Message</Label>
        <Textarea {...field("message")} rows={6} placeholder="Tell me a little about what you have in mind…" required maxLength={5000} />
        {err("message")}
      </div>
      {/* Honeypot: hidden from people, often filled by bots */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" ref={honeypot} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      {serverError ? (
        <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500">
          {serverError}{" "}
          <a className="underline" href={`mailto:${email}`}>
            Email me directly
          </a>
          .
        </p>
      ) : null}
      <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!enabled || state === "sending"}>
        {state === "sending" ? <LoaderCircle className="animate-spin" /> : <Send />}
        {state === "sending" ? "Sending…" : "Send message"}
      </Button>
    </form>
  );
}
