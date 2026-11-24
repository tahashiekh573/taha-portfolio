-- Muhammad Taha portfolio — Supabase schema
-- Run once in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).

-- Content sections (profile, about, experience, education, skills, certifications, resume, settings)
create table if not exists public.site_content (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

-- Projects (full project stored as JSON, with indexed columns for ordering/lookup)
create table if not exists public.projects (
  id          text primary key,
  slug        text not null unique,
  sort_order  integer not null default 0,
  visibility  text not null default 'draft' check (visibility in ('published','draft','hidden','archived')),
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);
create index if not exists projects_sort_idx on public.projects (sort_order);

-- Lock the tables down: Row Level Security on, no policies.
-- Only the server (service role key, never sent to the browser) can read or write.
alter table public.site_content enable row level security;
alter table public.projects     enable row level security;

-- Public storage bucket for profile photo, project screenshots, certificates and résumé.
-- Uploads go through the authenticated admin API using the service role key.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'portfolio', 'portfolio', true, 10485760,
  array['image/jpeg','image/png','image/webp','image/avif','image/gif','application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
