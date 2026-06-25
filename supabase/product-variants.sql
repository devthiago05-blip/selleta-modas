-- Grade de produtos: tamanho, cor, estampa e estoque por combinação.
-- Execute depois de rls-policies.sql e orders.sql.

begin;

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  size text not null check (char_length(trim(size)) between 1 and 30),
  color text not null check (char_length(trim(color)) between 1 and 50),
  print text not null default 'Sem estampa'
    check (char_length(trim(print)) between 1 and 80),
  sku text,
  stock integer not null default 0 check (stock >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (product_id, size, color, print)
);

create index if not exists product_variants_product_id_idx
on public.product_variants (product_id);

alter table public.product_variants enable row level security;

grant select on public.product_variants to anon, authenticated;
grant insert, update, delete on public.product_variants to authenticated;
revoke insert, update, delete on public.product_variants from anon;

drop policy if exists "catalog_product_variants_select" on public.product_variants;
drop policy if exists "admin_product_variants_select" on public.product_variants;
drop policy if exists "admin_product_variants_insert" on public.product_variants;
drop policy if exists "admin_product_variants_update" on public.product_variants;
drop policy if exists "admin_product_variants_delete" on public.product_variants;

create policy "catalog_product_variants_select"
on public.product_variants
for select
to anon, authenticated
using (
  active = true
  and exists (
    select 1
    from public.products p
    where p.id = product_id
      and p.ativo = true
  )
);

create policy "admin_product_variants_select"
on public.product_variants
for select
to authenticated
using ((select private.is_admin()));

create policy "admin_product_variants_insert"
on public.product_variants
for insert
to authenticated
with check ((select private.is_admin()));

create policy "admin_product_variants_update"
on public.product_variants
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy "admin_product_variants_delete"
on public.product_variants
for delete
to authenticated
using ((select private.is_admin()));

create or replace function private.sync_product_variant_summary(p_product_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.products
  set estoque = coalesce((
        select sum(v.stock)
        from public.product_variants v
        where v.product_id = p_product_id
          and v.active = true
      ), 0),
      tamanhos = coalesce((
        select string_agg(distinct v.size, ',' order by v.size)
        from public.product_variants v
        where v.product_id = p_product_id
          and v.active = true
      ), ''),
      cores = coalesce((
        select string_agg(distinct v.color, ',' order by v.color)
        from public.product_variants v
        where v.product_id = p_product_id
          and v.active = true
      ), '')
  where id = p_product_id;
end;
$$;

create or replace function private.sync_product_variant_summary_trigger()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.sync_product_variant_summary(coalesce(new.product_id, old.product_id));

  if tg_op = 'UPDATE' and new.product_id <> old.product_id then
    perform private.sync_product_variant_summary(old.product_id);
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
end;
$$;

revoke all on function private.sync_product_variant_summary(uuid) from public;
revoke all on function private.sync_product_variant_summary_trigger() from public;

drop trigger if exists product_variants_sync_summary on public.product_variants;
create trigger product_variants_sync_summary
after insert or update or delete on public.product_variants
for each row execute function private.sync_product_variant_summary_trigger();

create or replace function public.admin_replace_product_variants(
  p_product_id uuid,
  p_variants jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_variant jsonb;
  v_count integer;
  v_previous_stock integer;
  v_previous_sizes text;
  v_previous_colors text;
begin
  if not (select private.is_admin()) then
    raise exception 'Acesso negado';
  end if;

  if not exists (select 1 from public.products where id = p_product_id) then
    raise exception 'Produto não encontrado';
  end if;

  if jsonb_typeof(p_variants) <> 'array' then
    raise exception 'Grade inválida';
  end if;

  v_count := jsonb_array_length(p_variants);
  if v_count > 100 then
    raise exception 'A grade aceita no máximo 100 combinações';
  end if;

  select estoque, tamanhos, cores
  into v_previous_stock, v_previous_sizes, v_previous_colors
  from public.products
  where id = p_product_id;

  delete from public.product_variants where product_id = p_product_id;

  for v_variant in select * from jsonb_array_elements(p_variants)
  loop
    insert into public.product_variants (
      product_id, size, color, print, sku, stock, active
    )
    values (
      p_product_id,
      left(coalesce(nullif(trim(v_variant->>'size'), ''), 'Único'), 30),
      left(coalesce(nullif(trim(v_variant->>'color'), ''), 'Padrão'), 50),
      left(coalesce(nullif(trim(v_variant->>'print'), ''), 'Sem estampa'), 80),
      nullif(left(trim(coalesce(v_variant->>'sku', '')), 80), ''),
      greatest(0, least(999999, coalesce((v_variant->>'stock')::integer, 0))),
      coalesce((v_variant->>'active')::boolean, true)
    );
  end loop;

  if v_count = 0 then
    update public.products
    set estoque = v_previous_stock,
        tamanhos = v_previous_sizes,
        cores = v_previous_colors
    where id = p_product_id;
  else
    perform private.sync_product_variant_summary(p_product_id);
  end if;
end;
$$;

revoke all on function public.admin_replace_product_variants(uuid, jsonb) from public;
grant execute on function public.admin_replace_product_variants(uuid, jsonb)
to authenticated;

alter table public.order_items
  add column if not exists variant_id uuid references public.product_variants(id) on delete set null,
  add column if not exists print text not null default 'Sem estampa';

create index if not exists order_items_variant_id_idx
on public.order_items (variant_id);

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
  v_variant public.product_variants;
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
    select 1 from public.orders
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
    customer_name, customer_user_id, customer_phone, customer_address,
    notes, payment_method, payment_status, subtotal
  )
  values (
    trim(p_customer_name), (select auth.uid()), v_phone,
    nullif(trim(coalesce(p_customer_address, '')), ''),
    nullif(trim(coalesce(p_notes, '')), ''), p_payment_method,
    case when p_payment_method = 'pix' then 'pending' else 'pay_on_delivery' end,
    0
  )
  returning * into v_order;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_quantity := greatest(1, least(99, coalesce((v_item->>'quantity')::integer, 1)));

    select * into v_product
    from public.products
    where id = (v_item->>'product_id')::uuid
      and ativo = true;

    if not found then
      raise exception 'Produto indisponível';
    end if;

    v_variant := null;
    if nullif(v_item->>'variant_id', '') is not null then
      select * into v_variant
      from public.product_variants
      where id = (v_item->>'variant_id')::uuid
        and product_id = v_product.id
        and active = true;

      if not found then
        raise exception 'Variação indisponível para %', v_product.products;
      end if;

      if v_quantity > v_variant.stock then
        raise exception 'Estoque insuficiente para %', v_product.products;
      end if;
    elsif v_quantity > v_product.estoque then
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
      order_id, product_id, variant_id, product_name, size, color,
      print, quantity, unit_price
    )
    values (
      v_order.id, v_product.id, v_variant.id, v_product.products,
      left(coalesce(v_variant.size, nullif(trim(v_item->>'size'), ''), 'Único'), 30),
      left(coalesce(v_variant.color, nullif(trim(v_item->>'color'), ''), 'Padrão'), 50),
      left(coalesce(v_variant.print, nullif(trim(v_item->>'print'), ''), 'Sem estampa'), 80),
      v_quantity, v_unit_price
    );

    v_subtotal := v_subtotal + (v_quantity * v_unit_price);
  end loop;

  update public.orders set subtotal = v_subtotal where id = v_order.id;

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
        'print', i.print,
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
  if not (select private.is_admin()) then raise exception 'Acesso negado'; end if;

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

  if not found then raise exception 'Pedido não encontrado'; end if;

  if v_order.payment_method = 'pix'
    and p_order_status in ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
    and p_payment_status <> 'paid' then
    raise exception 'Confirme o pagamento Pix antes do pedido';
  end if;

  if p_order_status in ('confirmed', 'preparing', 'ready', 'out_for_delivery', 'delivered')
    and not v_order.stock_reserved then
    for v_item in
      select product_id, variant_id, quantity
      from public.order_items
      where order_id = p_order_id
    loop
      if v_item.variant_id is not null then
        update public.product_variants
        set stock = stock - v_item.quantity,
            updated_at = now()
        where id = v_item.variant_id
          and stock >= v_item.quantity;
      else
        update public.products
        set estoque = estoque - v_item.quantity
        where id = v_item.product_id
          and estoque >= v_item.quantity;
      end if;

      if not found then raise exception 'Estoque insuficiente ao confirmar pedido'; end if;
    end loop;
    v_order.stock_reserved := true;
  end if;

  if p_order_status = 'canceled'
    and v_order.stock_reserved
    and v_order.order_status <> 'canceled' then
    for v_item in
      select product_id, variant_id, quantity
      from public.order_items
      where order_id = p_order_id
    loop
      if v_item.variant_id is not null then
        update public.product_variants
        set stock = stock + v_item.quantity,
            updated_at = now()
        where id = v_item.variant_id;
      else
        update public.products
        set estoque = estoque + v_item.quantity
        where id = v_item.product_id;
      end if;
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

grant execute on function public.create_order(text, text, text, text, text, jsonb)
to anon, authenticated;
grant execute on function public.track_order(uuid, text) to anon, authenticated;
grant execute on function public.admin_update_order(uuid, text, text) to authenticated;

commit;
