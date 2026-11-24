import "server-only";

/** Server-side configuration. Nothing here is ever exposed to the browser. */
export const env = {
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseBucket: process.env.SUPABASE_STORAGE_BUCKET || "portfolio",
  dataStore: process.env.DATA_STORE ?? "",
  resendKey: process.env.RESEND_API_KEY ?? "",
  contactEmail: process.env.CONTACT_EMAIL || "tahasajjad678@gmail.com",
  contactFrom: process.env.CONTACT_FROM_EMAIL || "Portfolio Contact <onboarding@resend.dev>",
  githubToken: process.env.GITHUB_TOKEN ?? "",
  githubUsername: process.env.GITHUB_USERNAME || "tahashiekh573",
  adminEmail: (process.env.ADMIN_EMAIL ?? "").trim().toLowerCase(),
  adminPasswordHash: process.env.ADMIN_PASSWORD_HASH ?? "",
  authSecret: process.env.AUTH_SECRET ?? "",
  upstashUrl: process.env.UPSTASH_REDIS_REST_URL ?? "",
  upstashToken: process.env.UPSTASH_REDIS_REST_TOKEN ?? "",
  isProd: process.env.NODE_ENV === "production",
};

export type StoreKind = "supabase" | "file" | "seed";

export function storeKind(): StoreKind {
  if (env.supabaseUrl && env.supabaseServiceKey) return "supabase";
  if (env.dataStore === "file" || (!env.isProd && env.dataStore !== "seed")) return "file";
  return "seed";
}
