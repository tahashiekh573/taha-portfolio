import { Hero } from "@/components/site/hero";
import { About } from "@/components/site/about";
import { Experience } from "@/components/site/experience";
import { Section } from "@/components/site/section";
import { SkillsExplorer } from "@/components/site/skills";
import { ProjectsExplorer } from "@/components/site/projects";
import { Education } from "@/components/site/education";
import { Certifications } from "@/components/site/certifications";
import { Contact } from "@/components/site/contact";
import { GithubIcon } from "@/components/site/brand-icons";
import { getPublishedProjects, getSiteContent } from "@/lib/content";
import { getGithubProfile, getRepoStats } from "@/lib/github";

export default async function HomePage() {
  const [content, projects, profileStats] = await Promise.all([
    getSiteContent(),
    getPublishedProjects(),
    getGithubProfile(),
  ]);
  const stats = content.settings.showGithubStats ? await getRepoStats() : null;
  const { profile, settings } = content;
  const publicRepos = settings.showGithubStats ? (profileStats?.public_repos ?? null) : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: profile.name,
    jobTitle: profile.titles[0],
    description: settings.seoDescription,
    email: `mailto:${profile.email}`,
    address: { "@type": "PostalAddress", addressLocality: "Lahore", addressRegion: "Punjab", addressCountry: "PK" },
    alumniOf: content.education.map((e) => ({ "@type": "CollegeOrUniversity", name: e.institution })),
    sameAs: [profile.github, profile.linkedin],
    knowsAbout: content.skills.flatMap((s) => s.skills).slice(0, 30),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Hero profile={profile} hasResume={Boolean(content.resume.url)} />
      <About about={content.about} githubRepos={publicRepos} />
      <Experience items={content.experience} />
      <Section
        id="skills"
        eyebrow="Skills"
        title="Technical toolkit"
        description="Technologies I work with, grouped by area. Filter by category or search for a specific tool."
      >
        <SkillsExplorer categories={content.skills} />
      </Section>
      <Section
        id="projects"
        eyebrow="Projects"
        title="Things I've built"
        description={
          <>
            Real projects from my GitHub — AI agents, computer vision, machine learning and full-stack apps. Each one links to its source code.{" "}
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-medium text-accent-1 hover:underline"
            >
              <GithubIcon className="size-4" />
              {publicRepos ? `${publicRepos} public repositories on GitHub` : "View my GitHub profile"}
            </a>
          </>
        }
      >
        <ProjectsExplorer projects={projects} stats={stats} />
      </Section>
      <Education items={content.education} projectSlugs={projects.map((p) => p.slug)} />
      <Certifications items={content.certifications} />
      <Contact profile={profile} formEnabled={settings.contactFormEnabled} />
    </>
  );
}
