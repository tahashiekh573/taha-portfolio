"use client";

import { ArrowDown, ArrowLeft, ArrowUp, Eye, GitBranch, LoaderCircle, Plus, RefreshCw, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PROJECT_CATEGORIES, PROJECT_STATUSES, type GalleryImage, type Project, type Visibility } from "@/lib/types";
import { ICON_NAMES } from "@/components/site/icon";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import {
  api,
  AreaField,
  ConfirmButton,
  ItemList,
  LinesField,
  Panel,
  SelectField,
  TagsField,
  TextField,
  Toggle,
  UploadField,
} from "@/components/admin/fields";
import { cn, slugify } from "@/lib/utils";

const VIS_STYLES: Record<Visibility, string> = {
  published: "bg-emerald-500/15 text-emerald-500",
  draft: "bg-amber-500/15 text-amber-500",
  hidden: "bg-zinc-500/15 text-zinc-400",
  archived: "bg-zinc-500/15 text-zinc-500",
};

function blankProject(order: number): Project {
  return {
    id: "",
    slug: "",
    title: "",
    summary: "",
    objectives: [],
    functionality: [],
    features: [],
    tech: [],
    highlights: [],
    challenges: [],
    category: "Other",
    status: "In development",
    visibility: "draft",
    featured: false,
    order,
    coverIcon: "code",
    gallery: [],
  };
}

export function ProjectsAdmin({ projects, setProjects }: { projects: Project[]; setProjects: (p: Project[]) => void }) {
  const [editing, setEditing] = useState<Project | null>(null);
  const [filter, setFilter] = useState<"all" | Visibility>("all");
  const [busy, setBusy] = useState(false);
  const [importUrl, setImportUrl] = useState("");

  const sorted = [...projects].sort((a, b) => a.order - b.order);
  const shown = filter === "all" ? sorted : sorted.filter((p) => p.visibility === filter);

  async function saveProject(p: Project) {
    const isNew = !p.id;
    const res = await api<{ project: Project }>(isNew ? "POST" : "PUT", isNew ? "/api/admin/projects" : `/api/admin/projects/${p.id}`, p);
    setProjects(isNew ? [...projects, res.project] : projects.map((x) => (x.id === res.project.id ? res.project : x)));
    toast.success(isNew ? "Project created" : "Project saved");
    return res.project;
  }

  async function quickUpdate(p: Project, patch: Partial<Project>) {
    try {
      await saveProject({ ...p, ...patch });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function remove(p: Project) {
    try {
      await api("DELETE", `/api/admin/projects/${p.id}`);
      setProjects(projects.filter((x) => x.id !== p.id));
      toast.success("Project deleted");
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  async function move(index: number, dir: number) {
    const target = index + dir;
    if (target < 0 || target >= sorted.length) return;
    const ids = sorted.map((p) => p.id);
    [ids[index], ids[target]] = [ids[target], ids[index]];
    setBusy(true);
    try {
      const res = await api<{ projects: Project[] }>("PUT", "/api/admin/projects/reorder", { ids });
      setProjects(res.projects);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function importFromUrl() {
    setBusy(true);
    try {
      const res = await api<{ imported: Project[]; skipped: string[] }>("POST", "/api/admin/github/import", { url: importUrl });
      if (res.imported.length) {
        setProjects([...projects, ...res.imported]);
        toast.success("Imported as a draft — review it before publishing");
        setImportUrl("");
        setEditing(res.imported[0]);
      } else toast.error(res.skipped.join(", ") || "Nothing imported");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (editing) {
    return (
      <ProjectEditor
        project={editing}
        existingSlugs={projects.filter((p) => p.id !== editing.id).map((p) => p.slug)}
        onCancel={() => setEditing(null)}
        onSave={async (p) => {
          const saved = await saveProject(p);
          setEditing(saved);
        }}
      />
    );
  }

  return (
    <Panel
      title="Projects"
      description="Add, edit, reorder, feature, publish or hide projects. Hidden and archived projects stay in the database but are not shown."
      actions={
        <Button onClick={() => setEditing(blankProject(sorted.length + 1))}>
          <Plus /> New project
        </Button>
      }
    >
      <div className="flex flex-col gap-3 rounded-xl border border-line bg-bg-elevated/40 p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Label htmlFor="import-url">Import from a GitHub repository URL</Label>
          <Input id="import-url" value={importUrl} onChange={(e) => setImportUrl(e.target.value)} placeholder="https://github.com/tahashiekh573/my-new-repo" />
        </div>
        <Button variant="secondary" onClick={importFromUrl} disabled={busy || !importUrl}>
          {busy ? <LoaderCircle className="animate-spin" /> : <GitBranch />} Import as draft
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by visibility">
        {(["all", "published", "draft", "hidden", "archived"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-full border px-3 py-1 text-xs capitalize",
              filter === f ? "border-transparent bg-gradient-accent text-white" : "border-line text-muted",
            )}
          >
            {f} ({f === "all" ? projects.length : projects.filter((p) => p.visibility === f).length})
          </button>
        ))}
      </div>

      <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
        {shown.map((p) => {
          const index = sorted.findIndex((x) => x.id === p.id);
          return (
            <li key={p.id} className="flex flex-wrap items-center gap-3 bg-bg-elevated/30 p-3 sm:flex-nowrap">
              <span className="w-6 text-center font-mono text-xs text-subtle">{index + 1}</span>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => setEditing(p)} className="block truncate text-left text-sm font-medium text-fg hover:text-accent-1">
                  {p.title}
                </button>
                <p className="truncate text-xs text-subtle">
                  {p.category} · {p.repo ?? "no repo"}
                </p>
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium capitalize", VIS_STYLES[p.visibility])}>{p.visibility}</span>
              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className={cn("size-8", p.featured && "text-amber-400")}
                  aria-label={p.featured ? "Unfeature" : "Feature"}
                  aria-pressed={p.featured}
                  onClick={() => quickUpdate(p, { featured: !p.featured })}
                >
                  <Star className={cn(p.featured && "fill-current")} />
                </Button>
                {p.visibility === "published" ? (
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => quickUpdate(p, { visibility: "hidden" })}>
                    Unpublish
                  </Button>
                ) : (
                  <Button size="sm" variant="ghost" className="h-8 text-emerald-500" onClick={() => quickUpdate(p, { visibility: "published" })}>
                    Publish
                  </Button>
                )}
                {p.visibility === "published" ? (
                  <Button asChild size="icon" variant="ghost" className="size-8" aria-label="View on site">
                    <a href={`/projects/${p.slug}`} target="_blank" rel="noopener noreferrer">
                      <Eye />
                    </a>
                  </Button>
                ) : null}
                <Button size="icon" variant="ghost" className="size-8" aria-label="Move up" disabled={busy || index === 0 || filter !== "all"} onClick={() => move(index, -1)}>
                  <ArrowUp />
                </Button>
                <Button size="icon" variant="ghost" className="size-8" aria-label="Move down" disabled={busy || index === sorted.length - 1 || filter !== "all"} onClick={() => move(index, 1)}>
                  <ArrowDown />
                </Button>
                <ConfirmButton onConfirm={() => remove(p)} label={`Delete ${p.title}`} />
              </div>
            </li>
          );
        })}
        {!shown.length ? <li className="p-6 text-center text-sm text-muted">No projects in this view.</li> : null}
      </ul>
    </Panel>
  );
}

function ProjectEditor({
  project,
  existingSlugs,
  onCancel,
  onSave,
}: {
  project: Project;
  existingSlugs: string[];
  onCancel: () => void;
  onSave: (p: Project) => Promise<void>;
}) {
  const [p, setP] = useState<Project>(project);
  const [saving, setSaving] = useState(false);
  const patch = (x: Partial<Project>) => setP((cur) => ({ ...cur, ...x }));
  const slugTaken = existingSlugs.includes(p.slug);
  const dirty = JSON.stringify(p) !== JSON.stringify(project);

  async function save(visibility?: Visibility) {
    const next = { ...p, ...(visibility ? { visibility } : {}), slug: p.slug || slugify(p.title) };
    if (!next.title || next.summary.length < 10) {
      toast.error("Title and a short description (10+ characters) are required");
      return;
    }
    if (existingSlugs.includes(next.slug)) {
      toast.error("Another project already uses this URL slug");
      return;
    }
    setSaving(true);
    try {
      await onSave(next);
      setP(next);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel
      title={project.id ? `Edit: ${project.title}` : "New project"}
      description="Fields left empty are simply not shown on the project page. Only describe what the repository actually implements."
      actions={
        <Button variant="ghost" onClick={onCancel}>
          <ArrowLeft /> Back to list
        </Button>
      }
    >
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          label="Title"
          value={p.title}
          onChange={(title) => patch({ title, slug: project.id || p.slug ? p.slug : slugify(title) })}
        />
        <TextField
          label="URL slug"
          value={p.slug}
          onChange={(v) => patch({ slug: slugify(v) })}
          hint={slugTaken ? "⚠ Already used by another project" : `/projects/${p.slug || slugify(p.title) || "…"}`}
        />
        <SelectField label="Category" value={p.category} options={PROJECT_CATEGORIES} onChange={(category) => patch({ category })} />
        <SelectField label="Status" value={p.status} options={PROJECT_STATUSES} onChange={(status) => patch({ status })} />
        <SelectField
          label="Visibility"
          value={p.visibility}
          options={[
            { value: "published", label: "Published" },
            { value: "draft", label: "Draft" },
            { value: "hidden", label: "Hidden" },
            { value: "archived", label: "Archived" },
          ]}
          onChange={(visibility) => patch({ visibility })}
        />
        <TextField label="GitHub repository name" value={p.repo} onChange={(repo) => patch({ repo })} hint="Used to match GitHub stats and sync" />
        <TextField label="GitHub URL" value={p.githubUrl} onChange={(githubUrl) => patch({ githubUrl: githubUrl || undefined })} />
        <TextField label="Live demo URL" value={p.demoUrl} onChange={(demoUrl) => patch({ demoUrl: demoUrl || undefined })} hint="Only add a demo that actually works" />
      </div>
      <Toggle label="Featured project" checked={p.featured} onChange={(featured) => patch({ featured })} />
      <AreaField label="Short description (card)" value={p.summary} onChange={(summary) => patch({ summary })} rows={3} />
      <AreaField label="Project overview" value={p.overview} onChange={(overview) => patch({ overview: overview || undefined })} rows={5} hint="Separate paragraphs with a blank line" />
      <AreaField label="Problem statement" value={p.problem} onChange={(problem) => patch({ problem: problem || undefined })} rows={3} />
      <TagsField label="Technologies" value={p.tech} onChange={(tech) => patch({ tech })} />
      <LinesField label="Objectives" value={p.objectives} onChange={(objectives) => patch({ objectives })} rows={4} />
      <LinesField label="Main functionality" value={p.functionality} onChange={(functionality) => patch({ functionality })} rows={5} />
      <LinesField label="Key features" value={p.features} onChange={(features) => patch({ features })} rows={5} />
      <AreaField label="Architecture overview" value={p.architecture} onChange={(architecture) => patch({ architecture: architecture || undefined })} rows={4} />
      <LinesField label="Implementation highlights" value={p.highlights} onChange={(highlights) => patch({ highlights })} rows={4} />
      <LinesField label="Challenges & solutions (if documented)" value={p.challenges} onChange={(challenges) => patch({ challenges })} rows={3} />

      <div className="grid gap-5 sm:grid-cols-2">
        <UploadField label="Thumbnail (real screenshot)" value={p.thumbnail} onChange={(thumbnail) => patch({ thumbnail: thumbnail || undefined })} folder={`projects/${p.slug || "new"}`} />
        <SelectField label="Cover icon (used when there is no thumbnail)" value={p.coverIcon ?? "code"} options={ICON_NAMES} onChange={(coverIcon) => patch({ coverIcon })} />
      </div>
      <div>
        <Label>Screenshot gallery</Label>
        <ItemList<GalleryImage>
          items={p.gallery}
          onChange={(gallery) => patch({ gallery })}
          title={(g) => g.caption || g.src.split("/").pop() || "Screenshot"}
          create={() => ({ src: "" })}
          addLabel="Add screenshot"
          render={(g, u) => (
            <>
              <UploadField label="Image" value={g.src} onChange={(src) => u({ src })} folder={`projects/${p.slug || "new"}`} />
              <TextField label="Caption" value={g.caption} onChange={(caption) => u({ caption })} />
            </>
          )}
        />
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-5">
        {dirty ? <span className="mr-auto text-xs text-amber-500">Unsaved changes</span> : null}
        <Button variant="secondary" disabled={saving} onClick={() => save("draft")}>
          Save as draft
        </Button>
        <Button variant="secondary" disabled={saving} onClick={() => save("published")}>
          Save & publish
        </Button>
        <Button disabled={saving} onClick={() => save()}>
          {saving ? <LoaderCircle className="animate-spin" /> : null} Save changes
        </Button>
      </div>
    </Panel>
  );
}

// ------------------------------------------------------------------ GitHub sync
type Candidate = {
  name: string;
  description: string | null;
  language: string | null;
  url: string;
  stars: number;
  fork: boolean;
  empty: boolean;
  pushedAt: string;
};

export function GithubSync({ onImported }: { onImported: (p: Project[]) => void }) {
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ total: number; candidates: Candidate[] } | null>(null);
  const [selected, setSelected] = useState<string[]>([]);

  async function check() {
    setLoading(true);
    try {
      const res = await api<{ total: number; candidates: Candidate[] }>("GET", "/api/admin/github/sync");
      setResult(res);
      setSelected(res.candidates.filter((c) => !c.fork && !c.empty).map((c) => c.name));
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function runImport() {
    setImporting(true);
    try {
      const res = await api<{ imported: Project[]; skipped: string[] }>("POST", "/api/admin/github/import", { repos: selected });
      onImported(res.imported);
      if (res.imported.length) toast.success(`${res.imported.length} repositories imported as drafts`);
      if (res.skipped.length) toast.warning(`Skipped: ${res.skipped.join(", ")}`);
      setResult((r) => (r ? { ...r, candidates: r.candidates.filter((c) => !selected.includes(c.name)) } : r));
      setSelected([]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <Panel
      title="Sync GitHub projects"
      description="Find public repositories that are not in your portfolio yet. Selected repositories are imported as drafts with details taken from GitHub — review and publish them from Projects."
      actions={
        <Button onClick={check} disabled={loading}>
          {loading ? <LoaderCircle className="animate-spin" /> : <RefreshCw />} Check GitHub
        </Button>
      }
    >
      {!result ? (
        <p className="text-sm text-muted">Click “Check GitHub” to load the latest repository list.</p>
      ) : result.candidates.length === 0 ? (
        <p className="text-sm text-muted">All {result.total} public repositories are already in your portfolio.</p>
      ) : (
        <>
          <p className="text-sm text-muted">
            {result.candidates.length} of {result.total} repositories are not in the portfolio yet.
          </p>
          <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
            {result.candidates.map((c) => (
              <li key={c.name} className="flex items-start gap-3 bg-bg-elevated/30 p-3">
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-[var(--accent-2)]"
                  checked={selected.includes(c.name)}
                  onChange={(e) => setSelected((s) => (e.target.checked ? [...s, c.name] : s.filter((n) => n !== c.name)))}
                  aria-label={`Select ${c.name}`}
                />
                <div className="min-w-0 flex-1">
                  <a href={c.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-fg hover:text-accent-1">
                    {c.name}
                  </a>
                  <p className="text-xs text-muted">{c.description || "No description"}</p>
                  <p className="mt-1 text-[11px] text-subtle">
                    {[c.language, c.fork && "fork", c.empty && "empty repository", `pushed ${new Date(c.pushedAt).toLocaleDateString()}`]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button onClick={runImport} disabled={importing || !selected.length}>
              {importing ? <LoaderCircle className="animate-spin" /> : <Plus />} Import {selected.length} as drafts
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}
