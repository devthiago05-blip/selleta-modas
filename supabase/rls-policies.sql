-- Selleta Modas - políticas de produção para Supabase
-- Revise e execute no SQL Editor do Supabase.
-- IMPORTANTE: cadastre ao menos um administrador no bloco final antes de testar o painel.

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
alter table public.products enable row level security;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

grant select on public.products to anon, authenticated;
grant insert, update, delete on public.products to authenticated;
revoke insert, update, delete on public.products from anon;

-- Remove políticas antigas somente da tabela de produtos.
do $$
declare
  politica record;
begin
  for politica in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'products'
  loop
    execute format(
      'drop policy if exists %I on public.products',
      politica.policyname
    );
  end loop;
end
$$;

drop policy if exists "catalogo_publico_select" on public.products;
drop policy if exists "admin_products_insert" on public.products;
drop policy if exists "admin_products_update" on public.products;
drop policy if exists "admin_products_delete" on public.products;

create policy "catalogo_publico_select"
on public.products
for select
to anon, authenticated
using (true);

create policy "admin_products_insert"
on public.products
for insert
to authenticated
with check ((select private.is_admin()));

create policy "admin_products_update"
on public.products
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admin_products_delete"
on public.products
for delete
to authenticated
using ((select private.is_admin()));

drop policy if exists "admin_produtos_storage_insert" on storage.objects;
drop policy if exists "admin_produtos_storage_update" on storage.objects;
drop policy if exists "admin_produtos_storage_delete" on storage.objects;

create policy "admin_produtos_storage_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'produtos'
  and (select private.is_admin())
);

create policy "admin_produtos_storage_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'produtos'
  and (select private.is_admin())
)
with check (
  bucket_id = 'produtos'
  and (select private.is_admin())
);

create policy "admin_produtos_storage_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'produtos'
  and (select private.is_admin())
);

commit;

-- Verifique o resultado desta consulta. Políticas antigas do Storage são
-- combinadas com OR e podem liberar operações além do desejado.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

-- Execute separadamente, trocando pelo e-mail real do administrador:
--
-- insert into public.admin_users (user_id)
-- select id
-- from auth.users
-- where email = 'admin@seudominio.com'
-- on conflict (user_id) do nothing;
--
-- O bucket "produtos" deve permanecer público para as imagens do catálogo.
