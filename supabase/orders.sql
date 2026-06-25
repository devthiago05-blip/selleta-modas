-- Sistema de pedidos da Selleta Modas.
-- Execute depois de:
-- 1. product-commerce-fields.sql
-- 2. rls-policies.sql

begin;

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  public_token uuid not null default gen_random_uuid() unique,
  customer_user_id uuid references auth.users(id) on delete set null,
  customer_name text not null check (char_length(customer_name) between 2 and 100),
  customer_phone text not null check (char_length(customer_phone) between 8 and 20),
  customer_address text,
  notes text,
  payment_method text not null check (
    payment_method in ('pix', 'cash_on_delivery', 'card_on_delivery')
  ),
  payment_status text not null default 'pending' check (
    payment_status in ('pending', 'paid', 'pay_on_delivery', 'failed', 'refunded')
  ),
  order_status text not null default 'received' check (
    order_status in (
      'received',
      'confirmed',
      'preparing',
      'ready',
      'out_for_delivery',
      'delivered',
      'canceled'
    )
  ),
  subtotal numeric(10, 2) not null check (subtotal >= 0),
  stock_reserved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  size text not null,
  color text not null,
  quantity integer not null check (quantity > 0),
  unit_price numeric(10, 2) not null check (unit_price >= 0),
  line_total numeric(10, 2) generated always as (quantity * unit_price) stored
);

create index if not exists orders_created_at_idx
on public.orders (created_at desc);

create index if not exists orders_status_idx
on public.orders (order_status, payment_status);

create index if not exists order_items_order_id_idx
on public.order_items (order_id);

alter table public.orders enable row level security;
alter table public.order_items enable row level security;

revoke all on public.orders from anon;
revoke all on public.order_items from anon;
grant select on public.orders to authenticated;
grant select on public.order_items to authenticated;

drop policy if exists "admin_orders_select" on public.orders;
drop policy if exists "admin_order_items_select" on public.order_items;
drop policy if exists "customer_orders_select" on public.orders;
drop policy if exists "customer_order_items_select" on public.order_items;

create policy "admin_orders_select"
on public.orders
for select
to authenticated
using ((select private.is_admin()));

create policy "admin_order_items_select"
on public.order_items
for select
to authenticated
using ((select private.is_admin()));

create policy "customer_orders_select"
on public.orders
for select
to authenticated
using (customer_user_id = (select auth.uid()));

create policy "customer_order_items_select"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1
    from public.orders o
    where o.id = order_id
      and o.customer_user_id = (select auth.uid())
  )
);

create or replace function public.create_order(
  p_customer_name text,
  p_customer_phone text,
  p_customer_address text,
  p_notes text,
  p_payment_method text,
  p_items jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_unit_price numeric(10, 2);
  v_subtotal numeric(10, 2) := 0;
  v_phone text := regexp_replace(coalesce(p_customer_phone, ''), '\D', '', 'g');
begin
  if trim(coalesce(p_customer_name, '')) = ''
    or char_length(trim(p_customer_name)) < 2 then
    raise exception 'Nome inválido';
  end if;

  if char_length(v_phone) < 8 then
    raise exception 'Telefone inválido';
  end if;

  if exists (
    select 1
    from public.orders
    where customer_phone = v_phone
      and created_at > now() - interval '2 minutes'
  ) then
    raise exception 'Aguarde antes de criar outro pedido';
  end if;

  if p_payment_method not in ('pix', 'cash_on_delivery', 'card_on_delivery') then
    raise exception 'Forma de pagamento inválida';
  end if;

  if jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) = 0
    or jsonb_array_length(p_items) > 30 then
    raise exception 'Itens do pedido inválidos';
  end if;

  insert into public.orders (
    customer_name,
    customer_user_id,
    customer_phone,
    customer_address,
    notes,
    payment_method,
    payment_status,
    subtotal
  )
  values (
    trim(p_customer_name),
    (select auth.uid()),
    v_phone,
    nullif(trim(coalesce(p_customer_address, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''),
    p_payment_method,
    case
      when p_payment_method = 'pix' then 'pending'
      else 'pay_on_delivery'
    end,
    0
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(99, coalesce((v_item->>'quantity')::integer, 1)));

    select *
    into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and ativo = true;

    if not found then
      raise exception 'Produto indisponível';
    end if;

    if v_quantity > v_product.estoque then
      raise exception 'Estoque insuficiente para %', v_product.products;
    end if;

    v_unit_price := case
      when v_product.preco_promocional is not null
        and v_product.preco_promocional > 0
        and v_product.preco_promocional < v_product.preco
      then v_product.preco_promocional
      else v_product.preco
    end;

    insert into public.order_items (
      order_id,
      product_id,
      product_name,
      size,
      color,
      quantity,
      unit_price
    )
    values (
      v_order.id,
      v_product.id,
      v_product.products,
      left(coalesce(nullif(trim(v_item->>'size'), ''), 'Único'), 30),
      left(coalesce(nullif(trim(v_item->>'color'), ''), 'Padrão'), 50),
      v_quantity,
      v_unit_price
    );

    v_subtotal := v_subtotal + (v_quantity * v_unit_price);
  end loop;

  update public.orders
  set subtotal = v_subtotal
  where id = v_order.id;

  return jsonb_build_object(
    'order_number', v_order.order_number,
    'public_token', v_order.public_token,
    'payment_status', v_order.payment_status,
    'order_status', v_order.order_status,
    'subtotal', v_subtotal,
    'created_at', v_order.created_at
  );
end;
$$;

create or replace function public.claim_order(
  p_public_token uuid,
  p_customer_phone text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Faça login para vincular o pedido';
  end if;

  update public.orders
  set customer_user_id = (select auth.uid()),
      updated_at = now()
  where public_token = p_public_token
    and customer_phone = regexp_replace(p_customer_phone, '\D', '', 'g')
    and (
      customer_user_id is null
      or customer_user_id = (select auth.uid())
    );

  return found;
end;
$$;

create or replace function public.track_order(
  p_public_token uuid,
  p_customer_phone text
)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'payment_method', o.payment_method,
    'payment_status', o.payment_status,
    'order_status', o.order_status,
    'subtotal', o.subtotal,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'product_name', i.product_name,
        'size', i.size,
        'color', i.color,
        'quantity', i.quantity,
        'unit_price', i.unit_price
      ) order by i.id)
      from public.order_items i
      where i.order_id = o.id
    ), '[]'::jsonb)
  )
  from public.orders o
  where o.public_token = p_public_token
    and o.customer_phone = regexp_replace(p_customer_phone, '\D', '', 'g');
$$;

create or replace function public.admin_update_order(
  p_order_id uuid,
  p_payment_status text,
  p_order_status text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders;
  v_item record;
begin
  if not (select private.is_admin()) then
    raise exception 'Acesso negado';
  end if;

  if p_payment_status not in ('pending', 'paid', 'pay_on_delivery', 'failed', 'refunded')
    or p_order_status not in (
      'received', 'confirmed', 'preparing', 'ready',
      'out_for_delivery', 'delivered', 'canceled'
    ) then
    raise exception 'Status inválido';
  end if;

  select * into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'Pedido não encontrado';
  end if;

  if v_order.payment_method = 'pix'
    and p_order_status in ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
    and p_payment_status <> 'paid' then
    raise exception 'Confirme o pagamento Pix antes do pedido';
  end if;

  if p_order_status in ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
    and not v_order.stock_reserved then
    for v_item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id
    loop
      update public.products
      set estoque = estoque - v_item.quantity
      where id = v_item.product_id
        and estoque >= v_item.quantity;

      if not found then
        raise exception 'Estoque insuficiente ao confirmar pedido';
      end if;
    end loop;

    v_order.stock_reserved := true;
  end if;

  if p_order_status = 'canceled'
    and v_order.stock_reserved
    and v_order.order_status <> 'canceled' then
    for v_item in
      select product_id, quantity
      from public.order_items
      where order_id = p_order_id
    loop
      update public.products
      set estoque = estoque + v_item.quantity
      where id = v_item.product_id;
    end loop;

    v_order.stock_reserved := false;
  end if;

  update public.orders
  set payment_status = p_payment_status,
      order_status = p_order_status,
      stock_reserved = v_order.stock_reserved,
      updated_at = now()
  where id = p_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, text, text, jsonb) from public;
revoke all on function public.track_order(uuid, text) from public;
revoke all on function public.admin_update_order(uuid, text, text) from public;
revoke all on function public.claim_order(uuid, text) from public;

grant execute on function public.create_order(text, text, text, text, text, jsonb)
to anon, authenticated;

grant execute on function public.track_order(uuid, text)
to anon, authenticated;

grant execute on function public.admin_update_order(uuid, text, text)
to authenticated;

grant execute on function public.claim_order(uuid, text)
to authenticated;

commit;
