-- Imagem opcional para a seleção visual de estampas.

begin;

alter table public.product_variants
  add column if not exists print_image_url text;

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
      product_id, size, color, print, print_image_url, sku, stock, active
    )
    values (
      p_product_id,
      left(coalesce(nullif(trim(v_variant->>'size'), ''), 'Único'), 30),
      left(coalesce(nullif(trim(v_variant->>'color'), ''), 'Padrão'), 50),
      left(coalesce(nullif(trim(v_variant->>'print'), ''), 'Sem estampa'), 80),
      nullif(left(trim(coalesce(v_variant->>'print_image_url', '')), 2048), ''),
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

revoke all on function public.admin_replace_product_variants(uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.admin_replace_product_variants(uuid, jsonb)
to authenticated;

commit;
