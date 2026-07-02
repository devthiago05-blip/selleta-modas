-- Balanço manual de estoque por referência, cor e tamanho.

begin;

create table if not exists public.inventory_adjustments (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  variant_id uuid references public.product_variants(id) on delete set null,
  size text not null,
  color text not null,
  print text not null default 'Sem estampa',
  previous_stock integer not null check (previous_stock >= 0),
  new_stock integer not null check (new_stock >= 0),
  difference integer not null,
  reason text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists inventory_adjustments_product_created_idx
on public.inventory_adjustments (product_id, created_at desc);

alter table public.inventory_adjustments enable row level security;

revoke all on public.inventory_adjustments from anon, authenticated;
grant select on public.inventory_adjustments to authenticated;

drop policy if exists "admin_inventory_adjustments_select"
on public.inventory_adjustments;

create policy "admin_inventory_adjustments_select"
on public.inventory_adjustments
for select
to authenticated
using ((select private.is_admin()));

create or replace function public.admin_balance_product_stock(
  p_product_id uuid,
  p_color text,
  p_print text,
  p_quantities jsonb,
  p_reason text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_product public.products;
  v_variant public.product_variants;
  v_size text;
  v_raw_quantity text;
  v_quantity integer;
  v_previous_stock integer;
  v_color text := trim(coalesce(p_color, ''));
  v_print text := coalesce(nullif(trim(p_print), ''), 'Sem estampa');
  v_print_image_url text;
  v_created boolean;
  v_adjusted integer := 0;
begin
  if not (select private.is_admin()) then
    raise exception 'Acesso negado';
  end if;

  select * into v_product
  from public.products
  where id = p_product_id
  for update;

  if not found then
    raise exception 'Produto não encontrado';
  end if;

  if char_length(v_color) < 1 or char_length(v_color) > 50 then
    raise exception 'Cor inválida';
  end if;

  if char_length(v_print) > 80 then
    raise exception 'Estampa inválida';
  end if;

  if jsonb_typeof(p_quantities) <> 'object' then
    raise exception 'Quantidades inválidas';
  end if;

  select max(print_image_url)
  into v_print_image_url
  from public.product_variants
  where product_id = p_product_id
    and lower(trim(print)) = lower(v_print)
    and print_image_url is not null;

  foreach v_size in array array['P', 'M', 'G', 'GG']
  loop
    v_raw_quantity := p_quantities->>v_size;
    if v_raw_quantity is null or v_raw_quantity !~ '^\d+$' then
      raise exception 'Quantidade inválida para o tamanho %', v_size;
    end if;

    v_quantity := v_raw_quantity::integer;
    if v_quantity > 999999 then
      raise exception 'Quantidade acima do limite para o tamanho %', v_size;
    end if;

    select * into v_variant
    from public.product_variants
    where product_id = p_product_id
      and size = v_size
      and lower(trim(color)) = lower(v_color)
      and lower(trim(print)) = lower(v_print)
    limit 1
    for update;

    v_created := not found;
    if v_created then
      v_previous_stock := 0;
      insert into public.product_variants (
        product_id, size, color, print, print_image_url, stock, active
      )
      values (
        p_product_id, v_size, v_color, v_print,
        v_print_image_url, v_quantity, true
      )
      returning * into v_variant;
    else
      v_previous_stock := v_variant.stock;
      update public.product_variants
      set stock = v_quantity,
          active = true,
          updated_at = now()
      where id = v_variant.id;
    end if;

    if v_created or v_previous_stock <> v_quantity then
      insert into public.inventory_adjustments (
        product_id, product_name, variant_id, size, color, print,
        previous_stock, new_stock, difference, reason, created_by
      )
      values (
        v_product.id, v_product.products, v_variant.id, v_size,
        v_color, v_print, v_previous_stock, v_quantity,
        v_quantity - v_previous_stock,
        nullif(left(trim(coalesce(p_reason, '')), 200), ''),
        (select auth.uid())
      );
      v_adjusted := v_adjusted + 1;
    end if;
  end loop;

  return v_adjusted;
end;
$$;

revoke all on function public.admin_balance_product_stock(
  uuid, text, text, jsonb, text
) from public, anon, authenticated;
grant execute on function public.admin_balance_product_stock(
  uuid, text, text, jsonb, text
) to authenticated;

commit;
