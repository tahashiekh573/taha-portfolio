import { z } from "zod";
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from "@/lib/types";

const text = (max = 300) => z.string().trim().max(max);
const longText = (max = 6000) => z.string().trim().max(max);
const list = (max = 300, items = 60) => z.array(text(max)).max(items);
/** http(s) URL, a site-relative path, or empty. */
const link = z
  .string()
  .trim()
  .max(1000)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//i.test(v), "Must be a URL or a /path")
  .optional();

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.string().trim().email("Please enter a valid email").max(200),
  subject: z.string().trim().min(3, "Please add a subject").max(150),
  message: z.string().trim().min(10, "Message should be at least 10 characters").max(5000),
  website: z.string().max(0).optional().or(z.literal("")), // honeypot
  startedAt: z.number().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const profileSchema = z.object({
  name: text(100),
  greeting: text(60),
  titles: list(80, 10),
  intro: longText(800),
  location: text(120),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().regex(/^\+?[0-9]{7,15}$/, "Use digits only, e.g. +923001234567"),
  phoneDisplay: text(40),
  github: link.unwrap(),
  githubUsername: z.string().trim().regex(/^[A-Za-z0-9-]{1,39}$/),
  linkedin: link.unwrap(),
  whatsapp: z.string().trim().regex(/^[0-9]{7,15}$/, "Digits only, with country code"),
  whatsappMessage: text(300),
  photoUrl: link.unwrap(),
  photoPosition: text(40),
  photoAlt: text(150),
  availability: z.enum(["available", "open", "unavailable"]),
  availabilityText: text(80),
  techBadges: list(40, 8),
});

export const aboutSchema = z.object({
  headline: text(200),
  paragraphs: z.array(longText(2000)).max(10),
  focusAreas: z
    .array(z.object({ title: text(80), description: text(400), icon: text(40) }))
    .max(12),
  highlights: z.array(z.object({ label: text(60), value: text(120) })).max(8),
});

export const experienceSchema = z
  .array(
    z.object({
      id: text(80),
      company: text(150),
      location: text(150).optional(),
      role: text(150),
      period: text(80).optional(),
      type: text(60).optional(),
      summary: longText(1000).optional(),
      points: list(300, 20),
      groups: z.array(z.object({ title: text(150), points: list(300, 30) })).max(8).optional(),
      metrics: z.array(z.object({ label: text(60), value: text(60) })).max(12).optional(),
      metricsTitle: text(150).optional(),
      metricsNote: text(150).optional(),
      tech: list(60, 40),
      published: z.boolean(),
    }),
  )
  .max(30);

export const educationSchema = z
  .array(
    z.object({
      id: text(80),
      degree: text(200),
      institution: text(200),
      location: text(150).optional(),
      period: text(60),
      subjects: list(100, 30),
      finalProject: z
        .object({ title: text(200), projectSlug: text(100).optional() })
        .optional(),
      notes: longText(1000).optional(),
    }),
  )
  .max(10);

export const skillsSchema = z
  .array(z.object({ id: text(80), name: text(80), icon: text(40), skills: list(60, 60) }))
  .max(20);

export const certificationsSchema = z
  .array(
    z.object({
      id: text(80),
      title: text(200),
      issuer: text(150),
      date: text(60).optional(),
      credentialUrl: link,
      imageUrl: link,
      pdfUrl: link,
      verified: z.boolean(),
      notes: text(400).optional(),
    }),
  )
  .max(50);

export const resumeSchema = z.object({
  url: link,
  fileName: z.string().trim().regex(/^[\w.\- ]{1,100}\.pdf$/i, "Must end with .pdf"),
  updatedAt: text(40).optional(),
});

export const settingsSchema = z.object({
  seoTitle: text(120),
  seoDescription: text(320),
  siteUrl: z
    .string()
    .trim()
    .max(200)
    .refine((v) => v === "" || /^https:\/\/[^\s/]+/i.test(v), "Must start with https://"),
  keywords: list(60, 30),
  showGithubStats: z.boolean(),
  contactFormEnabled: z.boolean(),
  sendConfirmationEmail: z.boolean(),
  accent: z.enum(["blue-purple", "cyan-blue", "emerald-cyan"]),
});

export const sectionSchemas = {
  profile: profileSchema,
  about: aboutSchema,
  experience: experienceSchema,
  education: educationSchema,
  skills: skillsSchema,
  certifications: certificationsSchema,
  resume: resumeSchema,
  settings: settingsSchema,
} as const;

export const projectSchema = z.object({
  id: text(100),
  slug: z
    .string()
    .trim()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only")
    .max(80),
  title: text(150).min(2),
  repo: text(120).optional(),
  githubUrl: link,
  demoUrl: link,
  summary: longText(600).min(10, "Add a short description"),
  overview: longText().optional(),
  problem: longText(3000).optional(),
  objectives: list(400, 30),
  functionality: list(400, 40),
  features: list(400, 40),
  tech: list(60, 40),
  architecture: longText().optional(),
  highlights: list(400, 30),
  challenges: list(400, 30),
  category: z.enum(PROJECT_CATEGORIES),
  status: z.enum(PROJECT_STATUSES),
  visibility: z.enum(["published", "draft", "hidden", "archived"]),
  featured: z.boolean(),
  order: z.number().int().min(0).max(100000),
  thumbnail: link,
  coverIcon: text(40).optional(),
  gallery: z.array(z.object({ src: link.unwrap(), caption: text(200).optional() })).max(30),
  updatedAt: text(40).optional(),
});
