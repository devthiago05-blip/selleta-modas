-- Execute no SQL Editor do Supabase antes de usar promoção/status no painel.

begin;

alter table public.products
  add column if not exists preco_promocional numeric(10, 2),
  add column if not exists ativo boolean not null default true;

update public.products
set ativo = true
where ativo is null;

alter table public.products
  drop constraint if exists products_preco_promocional_check;

alter table public.products
  add constraint products_preco_promocional_check
  check (
    preco_promocional is null
    or (
      preco_promocional > 0
      and preco_promocional < preco
    )
  );

create index if not exists products_ativo_idx
on public.products (ativo);

commit;
