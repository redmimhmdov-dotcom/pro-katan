alter table public.order_items alter column product_id drop not null;
alter table public.order_items add column if not exists product_slug text;

alter table public.order_items drop constraint if exists order_items_product_id_fkey;
alter table public.order_items add constraint order_items_product_id_fkey foreign key (product_id) references public.products(id) on delete restrict;
alter table public.order_items add constraint order_items_product_reference_check check (product_id is not null or product_slug is not null);
