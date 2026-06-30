-- Correção para instalações que já executaram orders.sql.
-- Corrige UUID dos produtos e adiciona vínculo com clientes.

begin;

do $$
declare
  v_type text;
begin
  select data_type
  into v_type
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'order_items'
    and column_name = 'product_id';

  if v_type is distinct from 'uuid' then
    if exists (select 1 from public.order_items) then
      raise exception
        'Existem itens antigos com product_id incompatível. Faça backup e migração manual antes de continuar.';
    end if;

    alter table public.order_items
      alter column product_id type uuid
      using product_id::text::uuid;
  end if;
end
$$;

alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

alter table public.order_items
  add constraint order_items_product_id_fkey
  foreign key (product_id)
  references public.products(id);

alter table public.orders
  add column if not exists customer_user_id uuid
  references auth.users(id)
  on delete set null;

create index if not exists orders_customer_user_id_idx
on public.orders (customer_user_id, created_at desc);

drop policy if exists "customer_orders_select" on public.orders;
drop policy if exists "customer_order_items_select" on public.order_items;

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
      order_id, product_id, product_name, size, color, quantity, unit_price
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

revoke all on function public.create_order(text, text, text, text, text, jsonb)
from public, anon, authenticated;
revoke all on function public.claim_order(uuid, text)
from public, anon, authenticated;

grant execute on function public.create_order(text, text, text, text, text, jsonb)
to anon, authenticated;

grant execute on function public.claim_order(uuid, text)
to authenticated;

commit;
