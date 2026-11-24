"use client";

import {
  Award,
  Briefcase,
  Code,
  ExternalLink,
  FileText,
  FolderKanban,
  GitBranch,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Mail,
  Palette,
  Search,
  User,
  UserRound,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import type { Project, SectionKey, SiteContent } from "@/lib/types";
import { api, Panel } from "@/components/admin/fields";
import {
  AboutEditor,
  AppearanceEditor,
  CertificationsEditor,
  ContactSettingsEditor,
  EducationEditor,
  ExperienceEditor,
  PhotoEditor,
  ProfileEditor,
  ResumeEditor,
  SeoEditor,
  SkillsEditor,
  useSaveSection,
} from "@/components/admin/sections";
import { GithubSync, ProjectsAdmin } from "@/components/admin/projects-admin";
import { ThemeToggle } from "@/components/site/header";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Status = {
  store: "supabase" | "file" | "seed";
  email: boolean;
  contactFrom: string;
  contactTo: string;
  githubToken: boolean;
  sharedRateLimit: boolean;
  adminEmail: string;
};
type Data = { content: SiteContent; projects: Project[]; status: Status };

const NAV: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "profile", label: "Profile Information", icon: User },
  { id: "photo", label: "Profile Picture", icon: ImageIcon },
  { id: "about", label: "About Me", icon: UserRound },
  { id: "experience", label: "Experience", icon: Briefcase },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "skills", label: "Skills", icon: Code },
  { id: "projects", label: "Projects", icon: FolderKanban },
  { id: "github", label: "GitHub Sync", icon: GitBranch },
  { id: "certifications", label: "Certifications", icon: Award },
  { id: "resume", label: "Resume", icon: FileText },
  { id: "contact", label: "Contact Settings", icon: Mail },
  { id: "seo", label: "SEO Settings", icon: Search },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export function AdminApp() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(() => {
    const fromHash = typeof window === "undefined" ? "" : window.location.hash.slice(1);
    return NAV.some((n) => n.id === fromHash) ? fromHash : "overview";
  });

  useEffect(() => {
    let cancelled = false;
    api<Data>("GET", "/api/admin/content")
      .then((res) => !cancelled && setData(res))
      .catch((e: Error) => !cancelled && setError(e.message));
    return () => {
      cancelled = true;
    };
  }, []);

  const onSaved = useCallback((key: SectionKey, value: unknown) => {
    setData((d) => (d ? { ...d, content: { ...d.content, [key]: value } } : d));
  }, []);
  const save = useSaveSection(onSaved);

  function go(id: string) {
    setTab(id);
    history.replaceState(null, "", `#${id}`);
    window.scrollTo({ top: 0 });
  }

  async function logout() {
    await api("POST", "/api/admin/logout").catch(() => null);
    window.location.replace("/admin/login");
  }

  if (error) {
    return (
      <div className="grid min-h-dvh place-items-center p-6 text-center">
        <div>
          <p className="text-red-500">{error}</p>
          <Button className="mt-4" onClick={() => location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="grid min-h-dvh place-items-center" aria-busy="true">
        <LoaderCircle className="size-6 animate-spin text-muted" />
      </div>
    );
  }

  const { content, projects, status } = data;
  const setProjects = (p: Project[]) => setData((d) => (d ? { ...d, projects: p } : d));

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="glass sticky top-0 z-30 border-y-0 border-l-0 lg:h-dvh lg:overflow-y-auto">
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/" className="font-semibold" target="_blank" rel="noopener noreferrer">
            Taha<span className="text-gradient">.dev</span> <span className="text-xs font-normal text-subtle">admin</span>
          </Link>
          <ThemeToggle className="lg:hidden" />
        </div>
        <nav aria-label="Admin sections" className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible">
          {NAV.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => go(n.id)}
              aria-current={tab === n.id ? "page" : undefined}
              className={cn(
                "flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition",
                tab === n.id ? "bg-surface-strong text-fg ring-1 ring-line" : "text-muted hover:bg-surface hover:text-fg",
              )}
            >
              <n.icon className="size-4" />
              {n.label}
            </button>
          ))}
        </nav>
        <div className="hidden space-y-1 border-t border-line p-3 lg:block">
          <Link href="/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface hover:text-fg">
            <ExternalLink className="size-4" /> View site
          </Link>
          <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-surface hover:text-fg">
            <LogOut className="size-4" /> Sign out
          </button>
          <div className="flex items-center justify-between px-3 pt-2 text-xs text-subtle">
            {status.adminEmail}
            <ThemeToggle />
          </div>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-4xl space-y-6 p-4 sm:p-8">
        {status.store !== "supabase" ? (
          <div className={cn("rounded-xl border p-4 text-sm", status.store === "seed" ? "border-red-500/30 bg-red-500/10 text-red-500" : "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400")}>
            {status.store === "seed"
              ? "No database configured: you can browse content but changes cannot be saved. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (see README)."
              : "Local development store (.data/store.json). This does not persist on Vercel — configure Supabase for production."}
          </div>
        ) : null}

        <div key={tab}>
          {tab === "overview" && <Overview content={content} projects={projects} status={status} go={go} />}
          {tab === "profile" && <ProfileEditor value={content.profile} save={save} />}
          {tab === "photo" && <PhotoEditor value={content.profile} save={save} />}
          {tab === "about" && <AboutEditor value={content.about} save={save} />}
          {tab === "experience" && <ExperienceEditor value={content.experience} save={save} />}
          {tab === "education" && <EducationEditor value={content.education} save={save} />}
          {tab === "skills" && <SkillsEditor value={content.skills} save={save} />}
          {tab === "projects" && <ProjectsAdmin projects={projects} setProjects={setProjects} />}
          {tab === "github" && (
            <GithubSync
              onImported={(imported) => {
                setProjects([...projects, ...imported]);
              }}
            />
          )}
          {tab === "certifications" && <CertificationsEditor value={content.certifications} save={save} />}
          {tab === "resume" && <ResumeEditor value={content.resume} save={save} />}
          {tab === "contact" && <ContactSettingsEditor profile={content.profile} settings={content.settings} save={save} status={status} />}
          {tab === "seo" && <SeoEditor value={content.settings} save={save} />}
          {tab === "appearance" && <AppearanceEditor value={content.settings} save={save} />}
        </div>

        <div className="flex justify-center gap-4 pt-4 lg:hidden">
          <Link href="/" className="text-sm text-muted">View site</Link>
          <button type="button" onClick={logout} className="text-sm text-muted">Sign out</button>
        </div>
      </main>
    </div>
  );
}

function Overview({ content, projects, status, go }: { content: SiteContent; projects: Project[]; status: Status; go: (id: string) => void }) {
  const count = (v: Project["visibility"]) => projects.filter((p) => p.visibility === v).length;
  const stats = [
    { label: "Published projects", value: count("published"), tab: "projects" },
    { label: "Drafts", value: count("draft"), tab: "projects" },
    { label: "Featured", value: projects.filter((p) => p.featured).length, tab: "projects" },
    { label: "Verified certifications", value: content.certifications.filter((c) => c.verified).length, tab: "certifications" },
  ];
  const checks = [
    { ok: status.store === "supabase", label: "Database & storage (Supabase)", hint: "SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY" },
    { ok: status.email, label: "Contact email delivery (Resend)", hint: "RESEND_API_KEY, CONTACT_FROM_EMAIL" },
    { ok: status.githubToken, label: "GitHub token (optional, higher rate limits)", hint: "GITHUB_TOKEN" },
    { ok: status.sharedRateLimit, label: "Shared rate limiting (optional)", hint: "UPSTASH_REDIS_REST_URL / TOKEN" },
    { ok: Boolean(content.resume.url), label: "Resume uploaded", hint: "Resume section", tab: "resume" },
    { ok: content.certifications.some((c) => c.verified), label: "At least one verified certification", hint: "Certifications section", tab: "certifications" },
  ];
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <button key={s.label} type="button" onClick={() => go(s.tab)} className="card p-5 text-left transition hover:border-line-strong">
            <p className="text-3xl font-semibold text-fg">{s.value}</p>
            <p className="mt-1 text-xs text-muted">{s.label}</p>
          </button>
        ))}
      </div>
      <Panel title="Setup checklist" description="Integrations that need your accounts are configured with environment variables in Vercel.">
        <ul className="space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-3 rounded-xl border border-line bg-bg-elevated/40 p-3 text-sm">
              <span className={cn("size-2.5 shrink-0 rounded-full", c.ok ? "bg-emerald-500" : "bg-amber-500")} aria-hidden="true" />
              <span className="flex-1 text-fg">{c.label}</span>
              <span className="text-xs text-subtle">{c.ok ? "Ready" : c.hint}</span>
              {!c.ok && c.tab ? (
                <button type="button" className="text-xs text-accent-1 hover:underline" onClick={() => go(c.tab!)}>
                  Open
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Quick actions">
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => go("projects")}>Manage projects</Button>
          <Button variant="secondary" onClick={() => go("github")}>Sync GitHub</Button>
          <Button variant="secondary" onClick={() => go("photo")}>Change photo</Button>
          <Button variant="secondary" onClick={() => go("resume")}>Upload resume</Button>
          <Button
            variant="ghost"
            onClick={() => toast.info("Changes are live immediately after saving. Redeploys are only needed for code changes.")}
          >
            How publishing works
          </Button>
        </div>
      </Panel>
    </div>
  );
}
