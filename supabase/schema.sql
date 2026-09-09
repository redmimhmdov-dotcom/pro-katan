-- Katanbuild business foundation for Supabase.
-- Run this migration in Supabase SQL Editor before using admin.html.

create extension if not exists pgcrypto;

do $$ begin
  create type public.app_role as enum ('admin', 'accountant', 'sales_rep', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.customer_kind as enum ('regular', 'private');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.order_status as enum ('new', 'confirmed', 'completed', 'cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.invoice_status as enum ('paid', 'partial', 'prepaid');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  phone text,
  role public.app_role not null default 'viewer',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  name_en text,
  image_url text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name_ar text not null,
  name_en text,
  description_ar text,
  description_en text,
  sku text unique,
  image_url text,
  pdf_url text,
  price numeric(14,2) not null default 0,
  currency text not null default 'USD' check (currency in ('USD', 'SYP')),
  stock_quantity numeric(14,3) not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  kind public.customer_kind not null default 'regular',
  name text not null,
  phone text not null,
  address text,
  customer_code text unique,
  discount_percent numeric(5,2) not null default 0 check (discount_percent between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  customer_address text,
  customer_code text,
  latitude numeric(10,7),
  longitude numeric(10,7),
  status public.order_status not null default 'new',
  notes text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  discount_percent numeric(5,2) not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  invoice_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  status public.invoice_status not null default 'paid',
  currency text not null default 'USD' check (currency in ('USD', 'SYP')),
  exchange_rate numeric(14,2),
  subtotal numeric(14,2) not null default 0,
  discount_total numeric(14,2) not null default 0,
  paid_total numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  due_total numeric(14,2) generated always as (greatest(total - paid_total, 0)) stored,
  issued_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,3) not null check (quantity > 0),
  unit_price numeric(14,2) not null default 0,
  discount_percent numeric(5,2) not null default 0
);

create table if not exists public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete restrict,
  quantity numeric(14,3) not null,
  movement_type text not null check (movement_type in ('in', 'out', 'adjustment')),
  reference_id uuid,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.media_assets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  storage_path text not null,
  asset_type text not null check (asset_type in ('image', 'pdf')),
  section text,
  product_id uuid references public.products(id) on delete cascade,
  width integer,
  height integer,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role in ('admin', 'accountant', 'sales_rep', 'viewer')
  );
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and active and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.media_assets enable row level security;
alter table public.audit_logs enable row level security;

create policy "public can read active catalog" on public.categories for select using (active = true);
create policy "public can read active products" on public.products for select using (active = true);
create policy "public can create orders" on public.orders for insert with check (true);
create policy "public can create order items" on public.order_items for insert with check (true);

create policy "staff can read profiles" on public.profiles for select using (auth.uid() = id or public.is_staff());
create policy "admins manage profiles" on public.profiles for all using (public.is_admin()) with check (public.is_admin());
create policy "staff manage categories" on public.categories for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage products" on public.products for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage customers" on public.customers for all using (public.is_staff()) with check (public.is_staff());
create policy "staff read orders" on public.orders for select using (public.is_staff());
create policy "staff update orders" on public.orders for update using (public.is_staff()) with check (public.is_staff());
create policy "staff read order items" on public.order_items for select using (public.is_staff());
create policy "staff manage invoices" on public.invoices for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage invoice items" on public.invoice_items for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage stock" on public.inventory_movements for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage media" on public.media_assets for all using (public.is_staff()) with check (public.is_staff());
create policy "admins read audit logs" on public.audit_logs for select using (public.is_admin());
create policy "staff write audit logs" on public.audit_logs for insert with check (public.is_staff());

insert into storage.buckets (id, name, public)
values ('catalog-assets', 'catalog-assets', true)
on conflict (id) do nothing;

create policy "public can read catalog assets" on storage.objects for select
using (bucket_id = 'catalog-assets');
create policy "staff can upload catalog assets" on storage.objects for insert
with check (bucket_id = 'catalog-assets' and public.is_staff());
create policy "staff can update catalog assets" on storage.objects for update
using (bucket_id = 'catalog-assets' and public.is_staff());
create policy "admins can delete catalog assets" on storage.objects for delete
using (bucket_id = 'catalog-assets' and public.is_admin());
