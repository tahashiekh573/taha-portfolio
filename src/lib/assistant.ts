import "server-only";
import type { Project, SiteContent } from "@/lib/types";

/**
 * Knowledge for the portfolio assistant ("Taha's AI"). Everything it knows comes from the
 * same content the site renders, so edits made in the admin panel reach the assistant too.
 */

const list = (items: string[] | undefined, bullet = "- ") =>
  (items ?? []).filter(Boolean).map((i) => `${bullet}${i}`).join("\n");

export function buildKnowledge(content: SiteContent, projects: Project[]): string {
  const { profile, about, settings } = content;
  const parts: string[] = [];

  parts.push(`# Profile
Name: ${profile.name}
Titles: ${profile.titles.join(", ")}
Location: ${profile.location}
Availability: ${profile.availabilityText}
Intro: ${profile.intro}
Email: ${profile.email}
Phone / WhatsApp: ${profile.phoneDisplay}
GitHub: ${profile.github}
LinkedIn: ${profile.linkedin}
Résumé: ${content.resume.url ? "available for download at /resume?download" : "not uploaded yet"}`);

  parts.push(`# About
${about.headline}

${about.paragraphs.join("\n\n")}

Focus areas:
${about.focusAreas.map((f) => `- ${f.title}: ${f.description}`).join("\n")}
${about.highlights.length ? `\nHighlights:\n${about.highlights.map((h) => `- ${h.label}: ${h.value}`).join("\n")}` : ""}`);

  const exp = content.experience.filter((e) => e.published);
  if (exp.length) {
    parts.push(`# Experience
${exp
  .map(
    (e) => `## ${e.role} — ${e.company}${e.location ? ` (${e.location})` : ""}
${[e.period, e.type].filter(Boolean).join(" · ")}
${e.summary ?? ""}
${list(e.points)}
${(e.groups ?? []).map((g) => `${g.title}:\n${list(g.points)}`).join("\n")}
${e.metrics?.length ? `${e.metricsTitle ?? "Metrics"}: ${e.metrics.map((m) => `${m.label} ${m.value}`).join(", ")}${e.metricsNote ? ` (${e.metricsNote})` : ""}` : ""}
${e.tech.length ? `Tech: ${e.tech.join(", ")}` : ""}`,
  )
  .join("\n\n")}`);
  }

  if (content.education.length) {
    parts.push(`# Education
${content.education
  .map(
    (e) => `## ${e.degree} — ${e.institution}${e.location ? `, ${e.location}` : ""} (${e.period})
${e.subjects.length ? `Subjects: ${e.subjects.join(", ")}` : ""}
${e.finalProject ? `Final-year project: ${e.finalProject.title}${e.finalProject.projectSlug ? ` (/projects/${e.finalProject.projectSlug})` : ""}` : ""}
${e.notes ?? ""}`,
  )
  .join("\n\n")}`);
  }

  parts.push(`# Skills
${content.skills.map((s) => `- ${s.name}: ${s.skills.join(", ")}`).join("\n")}`);

  const certs = content.certifications.filter((c) => c.verified);
  if (certs.length) {
    parts.push(`# Certifications
${certs.map((c) => `- ${c.title} — ${c.issuer}${c.date ? ` (${c.date})` : ""}`).join("\n")}`);
  }

  parts.push(`# Projects (${projects.length})
${projects
  .map(
    (p) => `## ${p.title}
Page: /projects/${p.slug}${p.githubUrl ? `\nGitHub: ${p.githubUrl}` : ""}${p.demoUrl ? `\nLive demo: ${p.demoUrl}` : ""}
Category: ${p.category} · Status: ${p.status}${p.featured ? " · Featured" : ""}
Summary: ${p.summary}
${p.overview ? `Overview: ${p.overview}` : ""}
${p.problem ? `Problem: ${p.problem}` : ""}
${p.objectives.length ? `Objectives:\n${list(p.objectives)}` : ""}
${p.functionality.length ? `How it works:\n${list(p.functionality)}` : ""}
${p.features.length ? `Features:\n${list(p.features)}` : ""}
Tech stack: ${p.tech.join(", ")}
${p.architecture ? `Architecture: ${p.architecture}` : ""}
${p.highlights.length ? `Highlights:\n${list(p.highlights)}` : ""}
${p.challenges.length ? `Limitations / challenges:\n${list(p.challenges)}` : ""}`.replace(/\n{2,}/g, "\n"),
  )
  .join("\n\n")}`);

  parts.push(`# Site
Title: ${settings.seoTitle}
Sections: Home, About, Experience, Skills, Projects, Education, Certifications, Contact. The contact form is at /#contact.`);

  return parts.join("\n\n");
}

export function systemPrompt(content: SiteContent, projects: Project[]) {
  const name = content.profile.name;
  return `You are "Taha's AI", the assistant on ${name}'s personal portfolio website. Visitors are mostly recruiters, clients and fellow developers. Your job is to answer their questions about ${name}: his background, skills, experience, education, certifications and every project, and to help them get in touch.

How to answer:
- Use only the portfolio knowledge below. If something is not covered, say you don't have that detail and suggest contacting ${name} directly (email or WhatsApp). Never invent employers, dates, numbers, clients or results.
- Reply in the visitor's language: English, Urdu, or Roman Urdu (Urdu written in Latin letters). Match their style.
- Keep answers short and scannable: 2–6 sentences or a few bullets. Go deeper only when asked to explain a project in detail.
- When you mention a project, link its page as a Markdown link, e.g. [Face Attendance System](/projects/face-attendance-system). Link GitHub repositories with their full URL.
- Speak about ${name} in the third person ("he"), warmly and professionally, like a well-informed colleague. Don't oversell.
- For hiring or collaboration questions, mention his availability and the best ways to reach him.
- Stay on topic. For unrelated requests (general coding help, homework, other people), politely say you're here to talk about ${name}'s work.
- Plain Markdown only: bold, bullet lists and links. No headings and no tables.

<portfolio>
${buildKnowledge(content, projects)}
</portfolio>`;
}

// ── Offline answers ─────────────────────────────────────────────────────────
// Used when no ANTHROPIC_API_KEY is configured (or the API is unreachable), so the
// assistant still gives useful, accurate answers straight from the portfolio content.

const STOP = new Set(
  "the a an and or of for to in on with by is are was it this that what which who how about tell me his he you your me my do does did can could please project projects system app ai batao bataen kya ke ki ka hai hain mujhe ko se me mein aur".split(
    " ",
  ),
);
const words = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/[\s-]+/)
    .filter((w) => w.length > 1);
const has = (q: string, ...keys: string[]) => keys.some((k) => new RegExp(`\\b${k}`, "i").test(q));

function findProject(q: string, projects: Project[]) {
  const qw = new Set(words(q).filter((w) => !STOP.has(w)));
  let best: { p: Project; score: number } | null = null;
  for (const p of projects) {
    const tw = new Set([...words(p.title), ...words(p.slug), ...words(p.repo ?? "")].filter((w) => !STOP.has(w)));
    let score = 0;
    for (const w of qw) if (tw.has(w)) score += w.length > 3 ? 2 : 1;
    if (score > (best?.score ?? 0)) best = { p, score };
  }
  return best && best.score >= 2 ? best.p : null;
}

function projectAnswer(p: Project) {
  const lines = [`**[${p.title}](/projects/${p.slug})** — ${p.category}, ${p.status.toLowerCase()}.`, "", p.overview ?? p.summary];
  if (p.features.length) lines.push("", "**Key features:**", ...p.features.slice(0, 5).map((f) => `- ${f}`));
  lines.push("", `**Tech stack:** ${p.tech.join(", ")}`);
  if (p.githubUrl) lines.push(`**Code:** ${p.githubUrl}`);
  return lines.join("\n");
}

export function localAnswer(question: string, content: SiteContent, projects: Project[]): string {
  const q = question.toLowerCase();
  const { profile } = content;
  const contactLine = `**Email:** ${profile.email}\n**WhatsApp / phone:** ${profile.phoneDisplay}\n**LinkedIn:** ${profile.linkedin}\n**GitHub:** ${profile.github}`;

  if (/^\s*(hi|hello|hey|salam|assalam|aoa|hola)\b/.test(q) && q.length < 30) {
    return `Hi! 👋 I'm Taha's AI assistant. Ask me anything about ${profile.name}: his projects, skills, experience, education or how to contact him.`;
  }

  const project = findProject(q, projects);
  if (project) return projectAnswer(project);

  if (has(q, "contact", "email", "phone", "number", "whatsapp", "reach", "hire", "rabta", "linkedin", "call")) {
    return `You can reach ${profile.name} here (${profile.availabilityText.toLowerCase()}):\n\n${contactLine}\n\nOr use the [contact form](/#contact).`;
  }
  if (has(q, "resume", "cv")) {
    return content.resume.url
      ? `You can download ${profile.name}'s résumé [here](/resume?download).`
      : `The résumé hasn't been uploaded yet. Please ask for it directly:\n\n${contactLine}`;
  }
  if (has(q, "experience", "work", "job", "company", "companies", "intern", "kaam", "naukri", "career")) {
    const exp = content.experience.filter((e) => e.published);
    if (!exp.length) return `Work experience details aren't listed yet. See the [About section](/#about).`;
    return `**Work experience:**\n\n${exp.map((e) => `- **${e.role}** at ${e.company}${e.period ? ` (${e.period})` : ""}${e.summary ? ` — ${e.summary}` : ""}`).join("\n")}`;
  }
  if (has(q, "education", "degree", "university", "study", "studied", "college", "taleem", "bscs", "graduat")) {
    return `**Education:**\n\n${content.education.map((e) => `- **${e.degree}**, ${e.institution} (${e.period})${e.finalProject ? `. Final-year project: ${e.finalProject.title}` : ""}`).join("\n")}`;
  }
  if (has(q, "certif", "course")) {
    const certs = content.certifications.filter((c) => c.verified);
    return certs.length
      ? `**Certifications:**\n\n${certs.map((c) => `- ${c.title} — ${c.issuer}`).join("\n")}`
      : `No verified certifications are listed yet.`;
  }

  // "Does he know Python?" / "projects with React"
  const allSkills = content.skills.flatMap((s) => s.skills);
  const tech = [...new Set([...allSkills, ...projects.flatMap((p) => p.tech)])].filter((t) =>
    new RegExp(`(^|[^a-z0-9])${t.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z0-9]|$)`).test(q),
  );
  if (tech.length) {
    const used = projects.filter((p) => p.tech.some((t) => tech.some((x) => t.toLowerCase().includes(x.toLowerCase()))));
    const known = tech.filter((t) => allSkills.includes(t));
    let out = known.length ? `Yes — ${profile.name} works with **${known.join(", ")}**.` : `Here's where **${tech.join(", ")}** shows up in his work.`;
    if (used.length) out += `\n\nProjects using it:\n${used.map((p) => `- [${p.title}](/projects/${p.slug})`).join("\n")}`;
    return out;
  }

  if (has(q, "skill", "tech", "stack", "language", "tools", "know")) {
    return `**${profile.name}'s skills:**\n\n${content.skills.map((s) => `- **${s.name}:** ${s.skills.join(", ")}`).join("\n")}`;
  }
  if (has(q, "project", "built", "build", "portfolio", "work on", "bana")) {
    const featured = projects.filter((p) => p.featured);
    return `He has **${projects.length} projects** on this site${featured.length ? `. Featured ones:` : ":"}\n\n${(featured.length ? featured : projects)
      .map((p) => `- [${p.title}](/projects/${p.slug}) — ${p.category}`)
      .join("\n")}\n\nAsk me about any of them for details.`;
  }
  if (has(q, "where", "location", "city", "live", "based", "kahan", "lahore")) {
    return `${profile.name} is based in **${profile.location}**. ${profile.availabilityText}.`;
  }

  return `**${profile.name}** is a ${profile.titles.slice(0, 3).join(", ")} based in ${profile.location}. In his own words: “${profile.intro}”\n\nYou can ask me about:\n- his **projects** (e.g. "Tell me about the Atlassian AI Agent")\n- his **skills** ("Does he know Spring Boot?")\n- **experience**, **education** or **how to contact him**`;
}
