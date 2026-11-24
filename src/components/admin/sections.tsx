"use client";

import { useState } from "react";
import { toast } from "sonner";
import type {
  About,
  Certification,
  Education,
  Experience,
  Profile,
  Resume,
  SectionKey,
  Settings,
  SiteContent,
  SkillCategory,
} from "@/lib/types";
import { ICON_NAMES } from "@/components/site/icon";
import {
  api,
  AreaField,
  ItemList,
  LinesField,
  Panel,
  SaveBar,
  SelectField,
  TagsField,
  TextField,
  Toggle,
  UploadField,
} from "@/components/admin/fields";
import { Label } from "@/components/ui/input";
import { formatDate, whatsappLink } from "@/lib/utils";

export type SaveSection = <K extends SectionKey>(key: K, value: SiteContent[K]) => Promise<void>;

function useDraft<T>(initial: T) {
  const [draft, setDraft] = useState<T>(initial);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(initial);
  return { draft, setDraft, saving, setSaving, dirty, patch: (p: Partial<T>) => setDraft((d) => ({ ...d, ...p })) };
}

export function useSaveSection(onSaved: (key: SectionKey, value: unknown) => void): SaveSection {
  return async (key, value) => {
    const res = await api<{ value: unknown }>("PUT", `/api/admin/content/${key}`, value);
    onSaved(key, res.value);
    toast.success("Saved. The live site updates on the next visit.");
  };
}

async function run(setSaving: (v: boolean) => void, fn: () => Promise<void>) {
  setSaving(true);
  try {
    await fn();
  } catch (e) {
    toast.error((e as Error).message);
  } finally {
    setSaving(false);
  }
}

const iconOptions = ICON_NAMES.map((n) => ({ value: n, label: n }));

// ------------------------------------------------------------------ Profile
export function ProfileEditor({ value, save }: { value: Profile; save: SaveSection }) {
  const d = useDraft(value);
  const p = d.draft;
  return (
    <Panel title="Profile information" description="Name, titles, introduction and contact details shown across the site.">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Full name" value={p.name} onChange={(name) => d.patch({ name })} />
        <TextField label="Greeting" value={p.greeting} onChange={(greeting) => d.patch({ greeting })} />
      </div>
      <LinesField label="Rotating professional titles" value={p.titles} onChange={(titles) => d.patch({ titles })} rows={5} />
      <AreaField label="Hero introduction" value={p.intro} onChange={(intro) => d.patch({ intro })} rows={4} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label="Location" value={p.location} onChange={(location) => d.patch({ location })} />
        <TextField label="Email" type="email" value={p.email} onChange={(email) => d.patch({ email })} />
        <TextField label="Phone (for tel: links)" value={p.phone} onChange={(phone) => d.patch({ phone })} hint="International format, e.g. +923299422715" />
        <TextField label="Phone (displayed)" value={p.phoneDisplay} onChange={(phoneDisplay) => d.patch({ phoneDisplay })} />
        <TextField label="GitHub URL" value={p.github} onChange={(github) => d.patch({ github })} />
        <TextField label="GitHub username" value={p.githubUsername} onChange={(githubUsername) => d.patch({ githubUsername })} hint="Used for GitHub sync and stats" />
        <TextField label="LinkedIn URL" value={p.linkedin} onChange={(linkedin) => d.patch({ linkedin })} />
        <TextField label="WhatsApp number" value={p.whatsapp} onChange={(whatsapp) => d.patch({ whatsapp })} hint="Digits only with country code, e.g. 923299422715" />
      </div>
      <TagsField label="Floating technology badges (hero)" value={p.techBadges} onChange={(techBadges) => d.patch({ techBadges })} hint="Up to 5 are shown" />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          label="Availability indicator"
          value={p.availability}
          options={[
            { value: "available", label: "Available (green)" },
            { value: "open", label: "Open to opportunities (blue)" },
            { value: "unavailable", label: "Not available (grey)" },
          ]}
          onChange={(availability) => d.patch({ availability })}
        />
        <TextField label="Availability text" value={p.availabilityText} onChange={(availabilityText) => d.patch({ availabilityText })} />
      </div>
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("profile", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Profile picture
export function PhotoEditor({ value, save }: { value: Profile; save: SaveSection }) {
  const d = useDraft(value);
  const [x, y] = (d.draft.photoPosition.match(/(\d+(?:\.\d+)?)%\s+(\d+(?:\.\d+)?)%/)?.slice(1).map(Number) ?? [50, 50]) as number[];
  const setPos = (nx: number, ny: number) => d.patch({ photoPosition: `${nx}% ${ny}%` });
  return (
    <Panel
      title="Profile picture"
      description="Upload a professional photo (JPG, PNG or WebP, max 5 MB). The original image is kept unaltered; use the focal point to control how it is cropped into the circular frame."
    >
      <div className="grid gap-8 md:grid-cols-[220px_1fr]">
        <div>
          <p className="mb-2 text-sm font-medium text-fg">Preview</p>
          <div className="relative aspect-square w-full overflow-hidden rounded-full border-4 border-line bg-bg-elevated">
            {d.draft.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={d.draft.photoUrl} alt="" className="size-full object-cover" style={{ objectPosition: d.draft.photoPosition }} />
            ) : null}
          </div>
        </div>
        <div className="space-y-5">
          <UploadField label="Photo" value={d.draft.photoUrl} onChange={(photoUrl) => d.patch({ photoUrl })} folder="profile" />
          <div>
            <Label htmlFor="focal-x">Horizontal focal point: {x}%</Label>
            <input id="focal-x" type="range" min={0} max={100} value={x} onChange={(e) => setPos(Number(e.target.value), y)} className="w-full accent-[var(--accent-2)]" />
          </div>
          <div>
            <Label htmlFor="focal-y">Vertical focal point: {y}%</Label>
            <input id="focal-y" type="range" min={0} max={100} value={y} onChange={(e) => setPos(x, Number(e.target.value))} className="w-full accent-[var(--accent-2)]" />
          </div>
          <TextField label="Alt text" value={d.draft.photoAlt} onChange={(photoAlt) => d.patch({ photoAlt })} />
          {value.githubUsername ? (
            <button
              type="button"
              className="text-sm text-accent-1 hover:underline"
              onClick={() => d.patch({ photoUrl: `https://github.com/${value.githubUsername}.png?size=800` })}
            >
              Use my GitHub avatar instead
            </button>
          ) : null}
        </div>
      </div>
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("profile", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ About
export function AboutEditor({ value, save }: { value: About; save: SaveSection }) {
  const d = useDraft(value);
  return (
    <Panel title="About me" description="Biography, focus areas and key highlights. Only include highlights you can back up.">
      <TextField label="Headline" value={d.draft.headline} onChange={(headline) => d.patch({ headline })} />
      <div>
        <Label>Biography paragraphs</Label>
        <ItemList
          items={d.draft.paragraphs}
          onChange={(paragraphs) => d.patch({ paragraphs })}
          title={(p) => p.slice(0, 90) + (p.length > 90 ? "…" : "")}
          create={() => ""}
          addLabel="Add paragraph"
          render={(p, _u, i) => (
            <AreaField
              label={`Paragraph ${i + 1}`}
              value={p}
              rows={5}
              onChange={(v) => d.patch({ paragraphs: d.draft.paragraphs.map((x, k) => (k === i ? v : x)) })}
            />
          )}
        />
      </div>
      <div>
        <Label>Focus areas</Label>
        <ItemList
          items={d.draft.focusAreas}
          onChange={(focusAreas) => d.patch({ focusAreas })}
          title={(f) => f.title}
          create={() => ({ title: "New focus area", description: "", icon: "sparkles" })}
          addLabel="Add focus area"
          render={(f, u) => (
            <>
              <TextField label="Title" value={f.title} onChange={(title) => u({ title })} />
              <AreaField label="Description" value={f.description} onChange={(description) => u({ description })} rows={3} />
              <SelectField label="Icon" value={f.icon} options={iconOptions} onChange={(icon) => u({ icon })} />
            </>
          )}
        />
      </div>
      <div>
        <Label>Highlights</Label>
        <ItemList
          items={d.draft.highlights}
          onChange={(highlights) => d.patch({ highlights })}
          title={(h) => `${h.label}: ${h.value}`}
          create={() => ({ label: "", value: "" })}
          addLabel="Add highlight"
          render={(h, u) => (
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Label" value={h.label} onChange={(label) => u({ label })} />
              <TextField label="Value" value={h.value} onChange={(v) => u({ value: v })} />
            </div>
          )}
        />
      </div>
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("about", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Experience
export function ExperienceEditor({ value, save }: { value: Experience[]; save: SaveSection }) {
  const d = useDraft(value);
  return (
    <Panel title="Experience" description="Only publish entries with confirmed details. Leave dates empty unless they are verified.">
      <ItemList
        items={d.draft}
        onChange={d.setDraft}
        title={(e) => `${e.company}${e.published ? "" : "  (hidden)"}`}
        create={() => ({ id: crypto.randomUUID(), company: "New company", role: "", points: [], tech: [], published: false })}
        addLabel="Add experience"
        render={(e, u) => (
          <>
            <Toggle label="Published" checked={e.published} onChange={(published) => u({ published })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Company" value={e.company} onChange={(company) => u({ company })} />
              <TextField label="Role / area" value={e.role} onChange={(role) => u({ role })} />
              <TextField label="Location" value={e.location} onChange={(location) => u({ location })} />
              <TextField label="Period (optional)" value={e.period} onChange={(period) => u({ period })} placeholder="e.g. Jan 2025 – Present" />
              <TextField label="Type (optional)" value={e.type} onChange={(type) => u({ type })} placeholder="Full-time, Internship…" />
            </div>
            <AreaField label="Summary" value={e.summary} onChange={(summary) => u({ summary })} rows={3} />
            <LinesField label="Responsibilities / highlights" value={e.points} onChange={(points) => u({ points })} />
            <TagsField label="Technologies" value={e.tech} onChange={(tech) => u({ tech })} />
          </>
        )}
      />
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("experience", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Education
export function EducationEditor({ value, save }: { value: Education[]; save: SaveSection }) {
  const d = useDraft(value);
  return (
    <Panel title="Education" description="Do not add grades or awards that are not documented.">
      <ItemList
        items={d.draft}
        onChange={d.setDraft}
        title={(e) => `${e.degree} — ${e.institution}`}
        create={() => ({ id: crypto.randomUUID(), degree: "", institution: "", period: "", subjects: [] })}
        addLabel="Add education"
        render={(e, u) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Degree" value={e.degree} onChange={(degree) => u({ degree })} />
              <TextField label="Institution" value={e.institution} onChange={(institution) => u({ institution })} />
              <TextField label="Location" value={e.location} onChange={(location) => u({ location })} />
              <TextField label="Period" value={e.period} onChange={(period) => u({ period })} />
              <TextField
                label="Final project title"
                value={e.finalProject?.title}
                onChange={(title) => u({ finalProject: title ? { ...e.finalProject, title } : undefined })}
              />
              <TextField
                label="Final project slug (links to project page)"
                value={e.finalProject?.projectSlug}
                onChange={(projectSlug) => u({ finalProject: { title: e.finalProject?.title ?? "", projectSlug } })}
              />
            </div>
            <LinesField label="Relevant subjects" value={e.subjects} onChange={(subjects) => u({ subjects })} />
            <AreaField label="Notes (optional)" value={e.notes} onChange={(notes) => u({ notes })} rows={2} />
          </>
        )}
      />
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("education", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Skills
export function SkillsEditor({ value, save }: { value: SkillCategory[]; save: SaveSection }) {
  const d = useDraft(value);
  return (
    <Panel title="Skills" description="Categories and skills. No percentage ratings are displayed.">
      <ItemList
        items={d.draft}
        onChange={d.setDraft}
        title={(c) => `${c.name} (${c.skills.length})`}
        create={() => ({ id: crypto.randomUUID(), name: "New category", icon: "code", skills: [] })}
        addLabel="Add category"
        render={(c, u) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Category name" value={c.name} onChange={(name) => u({ name })} />
              <SelectField label="Icon" value={c.icon} options={iconOptions} onChange={(icon) => u({ icon })} />
            </div>
            <TagsField label="Skills" value={c.skills} onChange={(skills) => u({ skills })} />
          </>
        )}
      />
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("skills", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Certifications
export function CertificationsEditor({ value, save }: { value: Certification[]; save: SaveSection }) {
  const d = useDraft(value);
  return (
    <Panel
      title="Certifications"
      description="Only certifications marked as verified appear on the site. Confirm the exact title and completion before verifying."
    >
      <ItemList<Certification>
        items={d.draft}
        onChange={d.setDraft}
        title={(c) => `${c.verified ? "✓" : "○"}  ${c.title}`}
        create={() => ({ id: crypto.randomUUID(), title: "New certification", issuer: "", verified: false })}
        addLabel="Add certification"
        render={(c, u) => (
          <>
            <Toggle label="Verified & shown on site" checked={c.verified} onChange={(verified) => u({ verified })} />
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField label="Title" value={c.title} onChange={(title) => u({ title })} />
              <TextField label="Issuer" value={c.issuer} onChange={(issuer) => u({ issuer })} />
              <TextField label="Completion date" value={c.date} onChange={(date) => u({ date })} placeholder="e.g. March 2025" />
              <TextField label="Verification URL" value={c.credentialUrl} onChange={(credentialUrl) => u({ credentialUrl })} />
            </div>
            <UploadField label="Certificate image" value={c.imageUrl} onChange={(imageUrl) => u({ imageUrl })} folder="certificates" />
            <UploadField
              label="Certificate PDF"
              value={c.pdfUrl}
              onChange={(pdfUrl) => u({ pdfUrl })}
              folder="certificates"
              accept="application/pdf"
              kind="pdf"
            />
            <TextField label="Private notes (not shown)" value={c.notes} onChange={(notes) => u({ notes })} />
          </>
        )}
      />
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("certifications", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Resume
export function ResumeEditor({ value, save }: { value: Resume; save: SaveSection }) {
  const d = useDraft(value);
  return (
    <Panel
      title="Resume"
      description="Upload your résumé as a PDF (max 10 MB). Download buttons appear on the site only once a résumé is uploaded."
    >
      <UploadField
        label="Resume PDF"
        value={d.draft.url}
        onChange={(url) => d.patch({ url, updatedAt: new Date().toISOString() })}
        folder="resume"
        accept="application/pdf"
        kind="pdf"
      />
      <TextField label="Download file name" value={d.draft.fileName} onChange={(fileName) => d.patch({ fileName })} hint="Must end with .pdf" />
      {d.draft.updatedAt ? <p className="text-sm text-muted">Last updated: {formatDate(d.draft.updatedAt)}</p> : null}
      {d.draft.url ? (
        <div className="space-y-3">
          <div className="flex gap-3 text-sm">
            <a className="text-accent-1 hover:underline" href={d.draft.url} target="_blank" rel="noopener noreferrer">
              Open current file
            </a>
            <button type="button" className="text-red-500 hover:underline" onClick={() => d.patch({ url: undefined, updatedAt: undefined })}>
              Remove resume
            </button>
          </div>
          <iframe title="Resume preview" src={d.draft.url} className="h-[480px] w-full rounded-xl border border-line bg-white" />
        </div>
      ) : (
        <p className="rounded-xl border border-dashed border-line-strong p-4 text-sm text-muted">No resume uploaded yet.</p>
      )}
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("resume", { ...d.draft, url: d.draft.url || undefined }))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Contact settings
export function ContactSettingsEditor({
  profile,
  settings,
  save,
  status,
}: {
  profile: Profile;
  settings: Settings;
  save: SaveSection;
  status: { email: boolean; contactFrom: string; contactTo: string; sharedRateLimit: boolean };
}) {
  const s = useDraft(settings);
  const p = useDraft(profile);
  return (
    <Panel title="Contact settings" description="Contact form behaviour and direct-contact options.">
      <div className="rounded-xl border border-line bg-bg-elevated/40 p-4 text-sm">
        <p className="font-medium text-fg">Email delivery</p>
        {status.email ? (
          <p className="mt-1 text-muted">
            Resend is configured. Messages go to <strong className="text-fg">{status.contactTo}</strong> from{" "}
            <code className="text-xs">{status.contactFrom}</code>. These are set by the CONTACT_EMAIL and CONTACT_FROM_EMAIL environment variables.
          </p>
        ) : (
          <p className="mt-1 text-amber-500">RESEND_API_KEY is not set, so the contact form returns an error. See the README.</p>
        )}
        <p className="mt-2 text-muted">
          Rate limiting: {status.sharedRateLimit ? "shared via Upstash Redis" : "per server instance (add Upstash for shared limits)"}
        </p>
      </div>
      <Toggle label="Contact form enabled" checked={s.draft.contactFormEnabled} onChange={(contactFormEnabled) => s.patch({ contactFormEnabled })} />
      <Toggle
        label="Send confirmation email to visitors"
        hint="Requires a verified sending domain in Resend; Resend's test sender can only email your own address."
        checked={s.draft.sendConfirmationEmail}
        onChange={(sendConfirmationEmail) => s.patch({ sendConfirmationEmail })}
      />
      <AreaField label="Prefilled WhatsApp message" value={p.draft.whatsappMessage} onChange={(whatsappMessage) => p.patch({ whatsappMessage })} rows={2} />
      <a className="text-sm text-accent-1 hover:underline" href={whatsappLink(p.draft.whatsapp, p.draft.whatsappMessage)} target="_blank" rel="noopener noreferrer">
        Test WhatsApp link
      </a>
      <SaveBar
        dirty={s.dirty || p.dirty}
        saving={s.saving || p.saving}
        onSave={() =>
          run(s.setSaving, async () => {
            if (s.dirty) await save("settings", s.draft);
            if (p.dirty) await save("profile", p.draft);
          })
        }
      />
    </Panel>
  );
}

// ------------------------------------------------------------------ SEO
export function SeoEditor({ value, save }: { value: Settings; save: SaveSection }) {
  const d = useDraft(value);
  return (
    <Panel title="SEO settings" description="Search engine and social preview metadata.">
      <TextField label="Page title" value={d.draft.seoTitle} onChange={(seoTitle) => d.patch({ seoTitle })} />
      <AreaField label="Meta description" value={d.draft.seoDescription} onChange={(seoDescription) => d.patch({ seoDescription })} rows={3} hint={`${d.draft.seoDescription.length} / 160 characters recommended`} />
      <TextField
        label="Canonical site URL"
        value={d.draft.siteUrl}
        onChange={(siteUrl) => d.patch({ siteUrl })}
        hint="e.g. https://taha-portfolio.vercel.app — leave empty to use the Vercel production URL automatically"
      />
      <TagsField label="Keywords" value={d.draft.keywords} onChange={(keywords) => d.patch({ keywords })} />
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("settings", d.draft))} />
    </Panel>
  );
}

// ------------------------------------------------------------------ Appearance
export function AppearanceEditor({ value, save }: { value: Settings; save: SaveSection }) {
  const d = useDraft(value);
  const swatches = {
    "blue-purple": ["#3b82f6", "#8b5cf6"],
    "cyan-blue": ["#06b6d4", "#3b82f6"],
    "emerald-cyan": ["#10b981", "#06b6d4"],
  } as const;
  return (
    <Panel title="Website appearance" description="Accent colours and optional sections. Visitors can switch between dark (default) and light mode.">
      <div>
        <Label>Accent gradient</Label>
        <div className="flex flex-wrap gap-3">
          {(Object.keys(swatches) as (keyof typeof swatches)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => d.patch({ accent: k })}
              aria-pressed={d.draft.accent === k}
              className={`flex items-center gap-3 rounded-xl border p-3 text-sm ${d.draft.accent === k ? "border-accent-2 ring-2 ring-[color-mix(in_oklab,var(--accent-2)_30%,transparent)]" : "border-line"}`}
            >
              <span className="h-6 w-14 rounded-md" style={{ background: `linear-gradient(120deg, ${swatches[k][0]}, ${swatches[k][1]})` }} />
              {k}
            </button>
          ))}
        </div>
      </div>
      <Toggle
        label="Show GitHub statistics"
        hint="Public repository count and per-project stars/forks, fetched live from GitHub when available."
        checked={d.draft.showGithubStats}
        onChange={(showGithubStats) => d.patch({ showGithubStats })}
      />
      <SaveBar dirty={d.dirty} saving={d.saving} onSave={() => run(d.setSaving, () => save("settings", d.draft))} />
    </Panel>
  );
}
