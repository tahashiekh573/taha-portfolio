"use client";

import { LoaderCircle, LockKeyhole } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Sign-in failed");
      window.location.replace("/admin");
    } catch (err) {
      setError((err as Error).message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-5 p-8" aria-label="Admin sign in">
      <div className="text-center">
        <span className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-gradient-accent text-white">
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <h1 className="text-xl font-semibold text-fg">Admin sign in</h1>
        <p className="mt-1 text-sm text-muted">Taha.dev content management</p>
      </div>
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </div>
      {error ? (
        <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? <LoaderCircle className="animate-spin" /> : null} Sign in
      </Button>
      <p className="text-center text-xs text-subtle">
        <Link href="/" className="hover:text-fg">
          ← Back to portfolio
        </Link>
      </p>
    </form>
  );
}
