import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, storeKind, type StoreKind } from "@/lib/env";
import type { Project, SectionKey, SiteContent } from "@/lib/types";
import { projectSeed } from "@/content/projects";

/**
 * Persistence layer.
 *  - supabase: production (Postgres tables + Storage bucket), used when SUPABASE_* env vars are set
 *  - file:     local development only, writes to ./.data (Vercel's filesystem is read-only)
 *  - seed:     read-only; the site renders from src/content and admin writes are refused
 */
export interface Store {
  kind: StoreKind;
  getSections(): Promise<Partial<SiteContent>>;
  saveSection<K extends SectionKey>(key: K, value: SiteContent[K]): Promise<void>;
  /** Returns null when projects have never been written to this store. */
  listProjects(): Promise<Project[] | null>;
  replaceProjects(projects: Project[]): Promise<void>;
  saveProject(project: Project): Promise<void>;
  deleteProject(id: string): Promise<void>;
  upload(objectPath: string, bytes: Buffer, contentType: string): Promise<string>;
}

export class StoreNotConfiguredError extends Error {
  constructor() {
    super(
      "No database is configured. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to save changes.",
    );
  }
}

// ---------------------------------------------------------------- Supabase
let supabase: SupabaseClient | null = null;
function sb() {
  if (!supabase) {
    supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase;
}

type ProjectRow = { id: string; slug: string; sort_order: number; visibility: string; data: Project };
const toRow = (p: Project): ProjectRow => ({
  id: p.id,
  slug: p.slug,
  sort_order: p.order,
  visibility: p.visibility,
  data: p,
});

const supabaseStore: Store = {
  kind: "supabase",
  async getSections() {
    const { data, error } = await sb().from("site_content").select("key,value");
    if (error) throw new Error(`Supabase: ${error.message}`);
    const out: Record<string, unknown> = {};
    for (const row of data ?? []) out[row.key] = row.value;
    return out as Partial<SiteContent>;
  },
  async saveSection(key, value) {
    const { error } = await sb()
      .from("site_content")
      .upsert({ key, value, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase: ${error.message}`);
  },
  async listProjects() {
    const marker = await sb().from("site_content").select("key").eq("key", "__projects_initialized");
    if (marker.error) throw new Error(`Supabase: ${marker.error.message}`);
    if (!marker.data?.length) return null;
    const { data, error } = await sb().from("projects").select("data").order("sort_order");
    if (error) throw new Error(`Supabase: ${error.message}`);
    return (data ?? []).map((r) => r.data as Project);
  },
  async replaceProjects(projects) {
    const del = await sb().from("projects").delete().neq("id", "");
    if (del.error) throw new Error(`Supabase: ${del.error.message}`);
    if (projects.length) {
      const { error } = await sb().from("projects").insert(projects.map(toRow));
      if (error) throw new Error(`Supabase: ${error.message}`);
    }
    const { error } = await sb()
      .from("site_content")
      .upsert({ key: "__projects_initialized", value: true, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase: ${error.message}`);
  },
  async saveProject(project) {
    const { error } = await sb()
      .from("projects")
      .upsert({ ...toRow(project), updated_at: new Date().toISOString() });
    if (error) throw new Error(`Supabase: ${error.message}`);
  },
  async deleteProject(id) {
    const { error } = await sb().from("projects").delete().eq("id", id);
    if (error) throw new Error(`Supabase: ${error.message}`);
  },
  async upload(objectPath, bytes, contentType) {
    const bucket = sb().storage.from(env.supabaseBucket);
    const { error } = await bucket.upload(objectPath, bytes, { contentType, upsert: true });
    if (error) throw new Error(`Supabase Storage: ${error.message}`);
    return bucket.getPublicUrl(objectPath).data.publicUrl;
  },
};

// ---------------------------------------------------------------- Local file (development)
const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "store.json");
type FileData = { sections: Partial<SiteContent>; projects: Project[] | null };

async function readFileData(): Promise<FileData> {
  try {
    return JSON.parse(await fs.readFile(DATA_FILE, "utf8")) as FileData;
  } catch {
    return { sections: {}, projects: null };
  }
}
async function writeFileData(data: FileData) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  const tmp = `${DATA_FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, DATA_FILE);
}

const fileStore: Store = {
  kind: "file",
  async getSections() {
    return (await readFileData()).sections;
  },
  async saveSection(key, value) {
    const d = await readFileData();
    d.sections = { ...d.sections, [key]: value };
    await writeFileData(d);
  },
  async listProjects() {
    return (await readFileData()).projects;
  },
  async replaceProjects(projects) {
    const d = await readFileData();
    d.projects = projects;
    await writeFileData(d);
  },
  async saveProject(project) {
    const d = await readFileData();
    const list = d.projects ?? [];
    const i = list.findIndex((p) => p.id === project.id);
    if (i >= 0) list[i] = project;
    else list.push(project);
    d.projects = list.sort((a, b) => a.order - b.order);
    await writeFileData(d);
  },
  async deleteProject(id) {
    const d = await readFileData();
    d.projects = (d.projects ?? []).filter((p) => p.id !== id);
    await writeFileData(d);
  },
  async upload(objectPath, bytes) {
    const target = path.join(DATA_DIR, "uploads", objectPath);
    if (!target.startsWith(path.join(DATA_DIR, "uploads"))) throw new Error("Invalid path");
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, bytes);
    return `/api/files/${objectPath}`;
  },
};

// ---------------------------------------------------------------- Read-only seed
const seedStore: Store = {
  kind: "seed",
  async getSections() {
    return {};
  },
  async listProjects() {
    return null;
  },
  saveSection: async () => {
    throw new StoreNotConfiguredError();
  },
  replaceProjects: async () => {
    throw new StoreNotConfiguredError();
  },
  saveProject: async () => {
    throw new StoreNotConfiguredError();
  },
  deleteProject: async () => {
    throw new StoreNotConfiguredError();
  },
  upload: async () => {
    throw new StoreNotConfiguredError();
  },
};

export function getStore(): Store {
  const kind = storeKind();
  return kind === "supabase" ? supabaseStore : kind === "file" ? fileStore : seedStore;
}

export const FILE_UPLOAD_DIR = path.join(DATA_DIR, "uploads");

/** Makes sure the store holds the project list before the first write. */
export async function ensureProjectsInitialized(store: Store): Promise<Project[]> {
  const existing = await store.listProjects();
  if (existing) return existing;
  const seeded = structuredClone(projectSeed);
  await store.replaceProjects(seeded);
  return seeded;
}
