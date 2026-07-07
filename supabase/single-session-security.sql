-- Sessão única por usuário para projetos no plano gratuito.
-- Mantém somente a sessão mais recente e integra a validação às policies.

begin;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table if not exists private.active_user_sessions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  session_id uuid not null,
  session_created_at timestamptz not null,
  updated_at timestamptz not null default now()
);

alter table private.active_user_sessions enable row level security;
revoke all on table private.active_user_sessions from public, anon, authenticated;

create or replace function private.is_current_session()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.active_user_sessions active_session
    where active_session.user_id = (select auth.uid())
      and active_session.session_id = nullif(
        (select auth.jwt() ->> 'session_id'),
        ''
      )::uuid
  );
$$;

revoke all on function private.is_current_session() from public;
grant execute on function private.is_current_session() to authenticated;

create or replace function public.register_current_session()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
  v_session_id uuid;
  v_session_created_at timestamptz;
begin
  if v_user_id is null or nullif((select auth.jwt() ->> 'session_id'), '') is null then
    return false;
  end if;

  v_session_id := ((select auth.jwt() ->> 'session_id'))::uuid;

  select session.created_at
  into v_session_created_at
  from auth.sessions session
  where session.id = v_session_id
    and session.user_id = v_user_id;

  if v_session_created_at is null then
    return false;
  end if;

  insert into private.active_user_sessions (
    user_id,
    session_id,
    session_created_at,
    updated_at
  )
  values (
    v_user_id,
    v_session_id,
    v_session_created_at,
    now()
  )
  on conflict (user_id) do update
  set session_id = excluded.session_id,
      session_created_at = excluded.session_created_at,
      updated_at = now()
  where excluded.session_created_at >=
    private.active_user_sessions.session_created_at;

  return (select private.is_current_session());
end;
$$;

revoke all on function public.register_current_session() from public, anon;
grant execute on function public.register_current_session() to authenticated;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select (select private.is_current_session())
    and exists (
      select 1
      from public.admin_users
      where user_id = (select auth.uid())
    );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;

drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self"
on public.admin_users
for select
to authenticated
using (
  user_id = (select auth.uid())
  and (select private.is_current_session())
);

drop policy if exists "customer_orders_select" on public.orders;
create policy "customer_orders_select"
on public.orders
for select
to authenticated
using (
  customer_user_id = (select auth.uid())
  and (select private.is_current_session())
);

drop policy if exists "customer_order_items_select" on public.order_items;
create policy "customer_order_items_select"
on public.order_items
for select
to authenticated
using (
  (select private.is_current_session())
  and exists (
    select 1
    from public.orders order_parent
    where order_parent.id = order_id
      and order_parent.customer_user_id = (select auth.uid())
  )
);

commit;
