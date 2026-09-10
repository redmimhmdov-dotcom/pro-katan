create table if not exists public.sales_reps (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid unique references public.profiles(id) on delete set null,
  name text not null,
  phone text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.rep_daily_reports (
  id uuid primary key default gen_random_uuid(),
  rep_id uuid not null references public.sales_reps(id) on delete cascade,
  report_date date not null default current_date,
  new_customers integer not null default 0 check (new_customers >= 0),
  orders_count integer not null default 0 check (orders_count >= 0),
  sales_total numeric(14,2) not null default 0,
  cash_collected numeric(14,2) not null default 0,
  notes text,
  issues text,
  created_at timestamptz not null default now(),
  unique (rep_id, report_date)
);

create table if not exists public.cash_transactions (
  id uuid primary key default gen_random_uuid(),
  direction text not null check (direction in ('income', 'expense')),
  category text not null,
  amount numeric(14,2) not null check (amount >= 0),
  currency text not null default 'USD' check (currency in ('USD', 'SYP')),
  description text,
  invoice_id uuid references public.invoices(id) on delete set null,
  rep_id uuid references public.sales_reps(id) on delete set null,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table if not exists public.backup_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  actor_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.sales_reps enable row level security;
alter table public.rep_daily_reports enable row level security;
alter table public.cash_transactions enable row level security;
alter table public.backup_events enable row level security;

create policy "staff manage sales reps" on public.sales_reps for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage rep reports" on public.rep_daily_reports for all using (public.is_staff()) with check (public.is_staff());
create policy "staff manage cash transactions" on public.cash_transactions for all using (public.is_staff()) with check (public.is_staff());
create policy "admins manage backup events" on public.backup_events for all using (public.is_admin()) with check (public.is_admin());

create index if not exists orders_submitted_at_idx on public.orders (submitted_at desc);
create index if not exists invoices_issued_at_idx on public.invoices (issued_at desc);
create index if not exists cash_transactions_occurred_at_idx on public.cash_transactions (occurred_at desc);
create index if not exists rep_daily_reports_date_idx on public.rep_daily_reports (report_date desc);
