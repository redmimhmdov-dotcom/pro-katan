create table if not exists public.payment_submissions (
  id uuid primary key default gen_random_uuid(),
  invoice_reference text not null,
  payer_name text not null,
  payer_phone text not null,
  amount numeric(14,2),
  currency text not null default 'USD' check (currency in ('USD', 'SYP')),
  receipt_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.payment_submissions enable row level security;
create policy "public can submit payment receipts" on public.payment_submissions for insert with check (true);
create policy "staff can read payment submissions" on public.payment_submissions for select using (public.is_staff());
create policy "staff can review payment submissions" on public.payment_submissions for update using (public.is_staff()) with check (public.is_staff());

insert into storage.buckets (id, name, public)
values ('payment-receipts', 'payment-receipts', false)
on conflict (id) do nothing;

create policy "public can upload payment receipts" on storage.objects for insert
with check (bucket_id = 'payment-receipts');
create policy "staff can read payment receipts" on storage.objects for select
using (bucket_id = 'payment-receipts' and public.is_staff());
create policy "admins can delete payment receipts" on storage.objects for delete
using (bucket_id = 'payment-receipts' and public.is_admin());

create index if not exists payment_submissions_created_at_idx on public.payment_submissions (created_at desc);
