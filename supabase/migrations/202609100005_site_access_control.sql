create table if not exists public.site_access_state (
  id boolean primary key default true check (id),
  status text not null default 'trial' check (status in ('trial', 'paid', 'hidden')),
  trial_started_at timestamptz not null default now(),
  trial_expires_at timestamptz not null default (now() + interval '24 hours'),
  notice_enabled boolean not null default true,
  notice_message text not null default 'هذا الموقع تجريبي لمدة 24 ساعة. يرجى إتمام الدفع لتفعيل النسخة النهائية.',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_access_state (id) values (true) on conflict (id) do nothing;
alter table public.site_access_state enable row level security;
create policy "public can read site access state" on public.site_access_state for select using (true);
create policy "staff can update site access state" on public.site_access_state for update using (public.is_staff()) with check (public.is_staff());
