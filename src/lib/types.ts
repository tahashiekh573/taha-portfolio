// Shared content model for the portfolio. Everything the admin panel edits lives here.

export type Availability = "available" | "open" | "unavailable";

export interface Profile {
  name: string;
  greeting: string;
  titles: string[];
  intro: string;
  location: string;
  email: string;
  phone: string; // E.164 without spaces, e.g. +923299422715
  phoneDisplay: string;
  github: string;
  githubUsername: string;
  linkedin: string;
  whatsapp: string; // digits only, e.g. 923299422715
  whatsappMessage: string;
  photoUrl: string;
  photoPosition: string; // CSS object-position, e.g. "50% 20%"
  photoAlt: string;
  availability: Availability;
  availabilityText: string;
  techBadges: string[];
}

export interface FocusArea {
  title: string;
  description: string;
  icon: string; // lucide icon name, see components/site/icon.tsx
}

export interface About {
  headline: string;
  paragraphs: string[];
  focusAreas: FocusArea[];
  highlights: { label: string; value: string }[];
}

export interface Experience {
  id: string;
  company: string;
  location?: string;
  role: string;
  period?: string; // left empty unless confirmed
  type?: string;
  summary?: string;
  points: string[];
  /** Optional grouped responsibilities, e.g. one group per domain. */
  groups?: { title: string; points: string[] }[];
  /** Optional scores or numbers, e.g. monthly performance evaluations. */
  metrics?: { label: string; value: string }[];
  metricsTitle?: string;
  metricsNote?: string;
  tech: string[];
  published: boolean;
}

export interface Education {
  id: string;
  degree: string;
  institution: string;
  location?: string;
  period: string;
  subjects: string[];
  finalProject?: { title: string; projectSlug?: string };
  notes?: string;
}

export interface SkillCategory {
  id: string;
  name: string;
  icon: string;
  skills: string[];
}

export interface Certification {
  id: string;
  title: string;
  issuer: string;
  date?: string;
  credentialUrl?: string;
  imageUrl?: string;
  pdfUrl?: string;
  /** Only verified certifications are shown publicly. */
  verified: boolean;
  notes?: string;
}

export interface Resume {
  url?: string;
  fileName: string;
  updatedAt?: string;
}

export interface Settings {
  seoTitle: string;
  seoDescription: string;
  siteUrl: string;
  keywords: string[];
  showGithubStats: boolean;
  contactFormEnabled: boolean;
  sendConfirmationEmail: boolean;
  accent: "blue-purple" | "cyan-blue" | "emerald-cyan";
}

export interface SiteContent {
  profile: Profile;
  about: About;
  experience: Experience[];
  education: Education[];
  skills: SkillCategory[];
  certifications: Certification[];
  resume: Resume;
  settings: Settings;
}

export type SectionKey = keyof SiteContent;

export const PROJECT_CATEGORIES = [
  "AI & Machine Learning",
  "AI Agents & Automation",
  "Full Stack Development",
  "Backend Development",
  "Computer Vision",
  "Data Science & Analytics",
  "Enterprise Automation",
  "Java Projects",
  "Other",
] as const;
export type ProjectCategory = (typeof PROJECT_CATEGORIES)[number];

export const PROJECT_STATUSES = [
  "Completed",
  "Active development",
  "In development",
  "Prototype",
  "Learning project",
  "Archived",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export type Visibility = "published" | "draft" | "hidden" | "archived";

export interface GalleryImage {
  src: string;
  caption?: string;
}

export interface Project {
  id: string;
  slug: string;
  title: string;
  repo?: string; // GitHub repository name
  githubUrl?: string;
  demoUrl?: string;
  summary: string;
  overview?: string;
  problem?: string;
  objectives: string[];
  functionality: string[];
  features: string[];
  tech: string[];
  architecture?: string;
  highlights: string[];
  challenges: string[];
  category: ProjectCategory;
  status: ProjectStatus;
  visibility: Visibility;
  featured: boolean;
  order: number;
  thumbnail?: string;
  coverIcon?: string; // used when there is no real screenshot
  gallery: GalleryImage[];
  updatedAt?: string;
}
