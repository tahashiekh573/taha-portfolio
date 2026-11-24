/** Absolute site URL: admin setting → NEXT_PUBLIC_SITE_URL → Vercel production URL → localhost. */
export function resolveSiteUrl(configured?: string) {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "");
  return (configured || fromEnv || "http://localhost:3000").replace(/\/+$/, "");
}
