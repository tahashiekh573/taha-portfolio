# Muhammad Taha — Developer Portfolio

Personal portfolio for **Muhammad Taha**, Software Engineer and AI/ML Engineer (Lahore, Pakistan). It includes a secure admin dashboard for managing content after deployment.

**Stack:** Next.js 16 (App Router, Cache Components) · React 19 · TypeScript · Tailwind CSS 4 · Motion · Lucide · shadcn-style UI primitives · Supabase (Postgres + Storage) · Resend · GitHub REST API · Vercel.

---

## Features

**Public site**
- Hero with rotating titles, an availability badge and the profile photo in an animated frame
- About, Experience timeline, searchable and filterable Skills, Education, Certifications (only verified ones are shown) and Contact
- Projects grid with category filters, search and featured projects. Each project has a detail page covering overview, problem, objectives, functionality, features, stack, architecture, highlights, limitations, screenshots and status
- All project content was written from each GitHub repository's README and source code. Repositories that are empty or contain only practice work are kept but hidden
- Live GitHub stats (public repo count, stars and forks) when the API is reachable. The site still renders from local content during GitHub outages
- Working contact form: server-side validation, Resend delivery to Gmail with Reply-To set to the visitor, a honeypot, a timing check, rate limiting and an optional confirmation email
- Email, call, WhatsApp (with a prefilled message), LinkedIn and GitHub buttons
- Résumé download at `/resume?download` with a proper filename. The buttons only appear once a résumé has been uploaded
- Dark mode (default) and light mode, reduced-motion support, keyboard navigation, skip link, ARIA labels
- SEO: metadata, Open Graph image, JSON-LD Person schema, `sitemap.xml`, `robots.txt`, "MT" favicon, custom 404, error boundaries

**Admin dashboard (`/admin`)**
- Sections: Overview with a setup checklist, Profile, Profile Picture (upload, focal-point crop, GitHub avatar option), About, Experience, Education, Skills, Projects, GitHub Sync, Certifications (image/PDF upload), Resume (PDF upload and preview), Contact settings, SEO, Appearance
- Projects: create, edit, delete, reorder, feature, publish/unpublish, draft/hidden/archived states, thumbnail and gallery uploads, and import from a GitHub URL
- **Sync GitHub Projects** lists public repositories that aren't in the portfolio yet. You pick the ones to import and they come in as **drafts** for review before publishing
- Changes go live on the next page view; no redeploy needed

**Security**
- Admin password stored as a salted scrypt hash in an environment variable. There are no credentials in client code
- Signed, httpOnly, `SameSite=Strict` session cookie (8 hours)
- **Every** `/api/admin/*` route checks the session on the server and the `Origin` header. `proxy.ts` only redirects the UI to the login page
- Login rate limiting (5 attempts per 15 minutes per IP)
- Uploads are type-checked by file signature (magic bytes), not by extension, and size-limited
- Supabase tables have Row Level Security enabled with no policies, so only the server's service-role key can access them
- No secrets use `NEXT_PUBLIC_`

---

## 1. Run locally

Requires Node.js ≥ 20.9.

```bash
npm install
cp .env.example .env.local
npm run hash-password -- "choose-a-strong-password"   # paste both printed lines into .env.local
echo "DATA_STORE=file" >> .env.local                    # local data store without Supabase
npm run dev                                             # http://localhost:3000  (admin: /admin)
```

With `DATA_STORE=file`, edits and uploads are saved to `./.data/`, which is ignored by git. This mode is for development only: Vercel's filesystem is read-only.

Quality checks:

```bash
npm run typecheck && npm run lint && npm run build     # or: npm run check
```

---

## 2. Set up the services (one time)

### Supabase — database and file storage
1. Create a free project at <https://supabase.com>.
2. Open **SQL Editor → New query**, paste [`supabase/schema.sql`](supabase/schema.sql) and click **Run**. This creates the `site_content` and `projects` tables and the public `portfolio` storage bucket.
3. Go to **Project Settings → API** and copy the **Project URL** into `SUPABASE_URL` and the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY`. Keep the service-role key secret and use it only in server environment variables.

The first time you save a project in the admin panel, the built-in project list is copied into the database automatically.

### Resend — contact form email
1. Create an account at <https://resend.com> and create an API key. Put it in `RESEND_API_KEY`.
2. **For testing:** `CONTACT_FROM_EMAIL="Portfolio Contact <onboarding@resend.dev>"`. Resend only delivers from this test sender to the email address that owns the Resend account, so sign up with **tahasajjad678@gmail.com**.
3. **For production:** verify a domain you own in Resend (**Domains → Add domain**, then add the DNS records it shows). Then set, for example, `CONTACT_FROM_EMAIL="Muhammad Taha <contact@yourdomain.com>"`. A verified domain is required to send the optional visitor confirmation email.
4. `CONTACT_EMAIL=tahasajjad678@gmail.com` is where messages are delivered.

### GitHub token (optional)
Unauthenticated GitHub API calls are limited to 60 per hour. For 5,000 per hour, create a fine-grained token (**GitHub → Settings → Developer settings → Fine-grained tokens**) with *Public repositories (read-only)* access and set it as `GITHUB_TOKEN`.

### Upstash Redis (optional, recommended)
Rate limits are kept in memory per serverless instance by default. To share them across instances, create a free Redis database at <https://upstash.com> and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.

---

## 3. Deploy to Vercel

1. Push this folder to a new GitHub repository:
   ```bash
   git remote add origin https://github.com/tahashiekh573/portfolio.git
   git push -u origin main
   ```
2. In Vercel, choose **Add New → Project → Import** that repository. The framework is detected as Next.js and no build settings need to change.
3. Under **Environment Variables**, add the values from `.env.example`:

   | Variable | Required | Notes |
   |---|---|---|
   | `ADMIN_EMAIL` | ✅ | Admin login email |
   | `ADMIN_PASSWORD_HASH` | ✅ | From `npm run hash-password` |
   | `AUTH_SECRET` | ✅ | From `npm run hash-password` (≥ 32 characters) |
   | `SUPABASE_URL` | ✅ | |
   | `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Server only |
   | `RESEND_API_KEY` | ✅ | |
   | `CONTACT_EMAIL` | ✅ | `tahasajjad678@gmail.com` |
   | `CONTACT_FROM_EMAIL` | ✅ | Verified sender |
   | `GITHUB_TOKEN` | optional | |
   | `UPSTASH_REDIS_REST_URL` / `_TOKEN` | optional | |
   | `NEXT_PUBLIC_SITE_URL` | optional | Only needed for a custom domain |

   Do **not** set `DATA_STORE` on Vercel.
4. Click **Deploy**. The site is published at `https://<project>.vercel.app`.
5. Every push to `main` triggers a new deployment automatically. Content edited in `/admin` needs no deployment.

### After the first deploy — checklist
- [ ] Sign in at `/admin` and check that the **Overview** checklist shows Database and Email as *Ready*
- [ ] Upload your **résumé** (Resume section). The download buttons then appear
- [ ] Review **Certifications**: confirm each title and completion, add verification links or files, then switch on *Verified*
- [ ] Review **XICTEK Systems** under Experience (hidden until confirmed) and add dates only if they're documented
- [ ] Send a test message through the contact form and confirm it reaches Gmail
- [ ] Add a live demo URL to a project only after confirming the demo works

---

## Project structure

```
src/
  app/
    (site)/                 public pages: home + /projects/[slug]
    admin/                  dashboard UI + /admin/login
    api/contact/            contact form → Resend
    api/admin/*             authenticated content, project, upload and GitHub routes
    api/files/[...path]     serves uploads in local file mode only
    resume/                 résumé redirect/download
    sitemap.ts robots.ts opengraph-image.tsx icon.svg not-found.tsx error.tsx
  components/site/          public UI sections
  components/admin/         admin dashboard
  components/ui/            button, input, badge primitives
  content/site.ts           initial profile/experience/skills/etc. (fallback content)
  content/projects.ts       initial projects, written from the GitHub repositories
  lib/                      store (Supabase/file), auth, schemas, GitHub, rate limiting
  proxy.ts                  redirects signed-out users away from /admin
supabase/schema.sql         database + storage setup
scripts/hash-password.mjs   admin password hash generator
```

## How content works
- `src/content/*.ts` holds the initial content. It is shown as-is until a section is saved in the admin panel, and it is also the fallback if the database can't be reached.
- Saved sections and projects live in Supabase. Public pages are cached and refreshed immediately after each admin save.
- Project visibility: **published** (shown), **draft** (being prepared), **hidden** (kept but not shown, e.g. practice repositories), **archived**.
