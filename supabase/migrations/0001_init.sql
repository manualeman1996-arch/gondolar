-- ShelfSearch — initial schema, RLS and triggers.
-- Multi-tenant by `retailer_id`; shoppers are anonymous (anon role).

-- ── Extensions ───────────────────────────────────────────────────────────────
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;

-- ── Enums ────────────────────────────────────────────────────────────────────
do $$ begin
  create type store_format as enum
    ('supermercado','mayorista','farmacia','construccion','pet_shop','otro');
exception when duplicate_object then null; end $$;

do $$ begin
  create type admin_role as enum ('retailer_admin','super_admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type campaign_event_type as enum ('impression','click');
exception when duplicate_object then null; end $$;

do $$ begin
  create type feedback_reason as enum
    ('no_estaba_gondola','ubicacion_incorrecta','no_vi_marca','agotado','otro');
exception when duplicate_object then null; end $$;

-- ── updated_at trigger helper ────────────────────────────────────────────────
create or replace function public.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ── Tables ───────────────────────────────────────────────────────────────────
create table if not exists public.retailers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  country text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  name text not null,
  slug text not null unique,
  address text,
  city text,
  state text,
  country text,
  format store_format not null default 'supermercado',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid references public.retailers(id) on delete cascade,
  name text not null,
  slug text not null,
  parent_category_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (retailer_id, slug)
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  brand text,
  sku text,
  description text,
  image_url text,
  tags text[] not null default '{}',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_locations (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  aisle text,
  shelf text,
  side text,
  height text,
  zone text,
  instructions text,
  updated_at timestamptz not null default now(),
  unique (product_id)
);

create table if not exists public.search_events (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  anonymous_session_id text not null,
  query text not null default '',
  normalized_query text not null default '',
  result_count int not null default 0,
  clicked_product_id uuid references public.products(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.product_view_events (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  anonymous_session_id text not null,
  query text,
  created_at timestamptz not null default now()
);

create table if not exists public.feedback_events (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  anonymous_session_id text not null,
  query text,
  found boolean not null,
  reason feedback_reason,
  created_at timestamptz not null default now()
);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  name text not null,
  brand text,
  store_id uuid references public.stores(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  product_id uuid not null references public.products(id) on delete cascade,
  keywords text[] not null default '{}',
  start_date date,
  end_date date,
  budget numeric(12,2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  retailer_id uuid not null references public.retailers(id) on delete cascade,
  store_id uuid not null references public.stores(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  anonymous_session_id text not null,
  event_type campaign_event_type not null,
  query text,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null unique references auth.users(id) on delete cascade,
  retailer_id uuid references public.retailers(id) on delete cascade,
  role admin_role not null default 'retailer_admin',
  name text,
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_stores_retailer on public.stores(retailer_id);
create index if not exists idx_products_store on public.products(store_id);
create index if not exists idx_products_retailer on public.products(retailer_id);
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_name_trgm
  on public.products using gin (lower(name) extensions.gin_trgm_ops);
create index if not exists idx_products_brand_trgm
  on public.products using gin (lower(coalesce(brand,'')) extensions.gin_trgm_ops);
create index if not exists idx_products_tags on public.products using gin (tags);
-- Natural key for upsert (CSV import + seed): one product per store/name/brand.
create unique index if not exists uq_products_store_name_brand
  on public.products (store_id, lower(name), lower(coalesce(brand, '')));
create index if not exists idx_locations_product on public.product_locations(product_id);
create index if not exists idx_search_events_store_created
  on public.search_events(store_id, created_at desc);
create index if not exists idx_view_events_store_created
  on public.product_view_events(store_id, created_at desc);
create index if not exists idx_feedback_events_store_created
  on public.feedback_events(store_id, created_at desc);
create index if not exists idx_campaign_events_campaign
  on public.campaign_events(campaign_id, created_at desc);
create index if not exists idx_campaigns_store on public.campaigns(store_id);

-- ── updated_at triggers ──────────────────────────────────────────────────────
do $$
declare t text;
begin
  foreach t in array array[
    'retailers','stores','categories','products','product_locations','campaigns'
  ] loop
    execute format(
      'drop trigger if exists trg_%1$s_updated on public.%1$s;', t);
    execute format(
      'create trigger trg_%1$s_updated before update on public.%1$s
         for each row execute function public.set_updated_at();', t);
  end loop;
end $$;

-- product_locations only has updated_at (no created_at) but trigger still fine.

-- ── Tenant helper functions (security definer to avoid RLS recursion) ─────────
create or replace function public.current_retailer_id()
returns uuid language sql stable security definer set search_path = public as $$
  select retailer_id from public.profiles where auth_user_id = auth.uid() limit 1
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role = 'super_admin'
  )
$$;

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.retailers           enable row level security;
alter table public.stores              enable row level security;
alter table public.categories          enable row level security;
alter table public.products            enable row level security;
alter table public.product_locations   enable row level security;
alter table public.search_events       enable row level security;
alter table public.product_view_events enable row level security;
alter table public.feedback_events     enable row level security;
alter table public.campaigns           enable row level security;
alter table public.campaign_events     enable row level security;
alter table public.profiles            enable row level security;

-- Retailers: branding only — public read; super admin manages.
create policy retailers_read on public.retailers
  for select using (true);
create policy retailers_admin_all on public.retailers
  for all using (id = public.current_retailer_id() or public.is_super_admin())
  with check (id = public.current_retailer_id() or public.is_super_admin());

-- Stores: anon reads active; admin manages own retailer.
create policy stores_public_read on public.stores
  for select using (is_active = true);
create policy stores_admin_all on public.stores
  for all using (retailer_id = public.current_retailer_id() or public.is_super_admin())
  with check (retailer_id = public.current_retailer_id() or public.is_super_admin());

-- Categories: public read (used by shopper); admin manages own (or global).
create policy categories_public_read on public.categories
  for select using (true);
create policy categories_admin_all on public.categories
  for all using (retailer_id = public.current_retailer_id() or public.is_super_admin())
  with check (retailer_id = public.current_retailer_id() or public.is_super_admin());

-- Products: anon reads active; admin manages own retailer.
create policy products_public_read on public.products
  for select using (is_active = true);
create policy products_admin_all on public.products
  for all using (retailer_id = public.current_retailer_id() or public.is_super_admin())
  with check (retailer_id = public.current_retailer_id() or public.is_super_admin());

-- Product locations: public read (tied to already-visible products); admin manages.
create policy locations_public_read on public.product_locations
  for select using (true);
create policy locations_admin_all on public.product_locations
  for all using (
    exists (select 1 from public.products p
      where p.id = product_locations.product_id
        and (p.retailer_id = public.current_retailer_id() or public.is_super_admin())))
  with check (
    exists (select 1 from public.products p
      where p.id = product_locations.product_id
        and (p.retailer_id = public.current_retailer_id() or public.is_super_admin())));

-- Campaigns: anon reads active (for sponsored search); admin manages own.
create policy campaigns_public_read on public.campaigns
  for select using (is_active = true);
create policy campaigns_admin_all on public.campaigns
  for all using (retailer_id = public.current_retailer_id() or public.is_super_admin())
  with check (retailer_id = public.current_retailer_id() or public.is_super_admin());

-- Event tables: anon may INSERT (no PII); admin reads own retailer's events.
create policy search_events_insert on public.search_events
  for insert with check (true);
create policy search_events_admin_read on public.search_events
  for select using (retailer_id = public.current_retailer_id() or public.is_super_admin());

create policy view_events_insert on public.product_view_events
  for insert with check (true);
create policy view_events_admin_read on public.product_view_events
  for select using (retailer_id = public.current_retailer_id() or public.is_super_admin());

create policy feedback_events_insert on public.feedback_events
  for insert with check (true);
create policy feedback_events_admin_read on public.feedback_events
  for select using (retailer_id = public.current_retailer_id() or public.is_super_admin());

create policy campaign_events_insert on public.campaign_events
  for insert with check (true);
create policy campaign_events_admin_read on public.campaign_events
  for select using (retailer_id = public.current_retailer_id() or public.is_super_admin());

-- Profiles: a user reads/updates only their own row.
create policy profiles_self_read on public.profiles
  for select using (auth_user_id = auth.uid() or public.is_super_admin());
create policy profiles_self_update on public.profiles
  for update using (auth_user_id = auth.uid());
