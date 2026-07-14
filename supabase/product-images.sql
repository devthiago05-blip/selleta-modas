-- Selleta Modas - galeria de imagens por produto.
-- Mantém products.imagem como imagem principal por compatibilidade.

alter table public.products
  add column if not exists imagens text[] not null default '{}'::text[];

update public.products
set imagens = array[imagem]
where imagem is not null
  and btrim(imagem) <> ''
  and cardinality(imagens) = 0;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'products_imagens_limite'
      and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
      add constraint products_imagens_limite
      check (cardinality(imagens) <= 8 and array_position(imagens, null) is null);
  end if;
end $$;

comment on column public.products.imagens is
  'Galeria de imagens do produto. A primeira imagem continua espelhada em products.imagem para compatibilidade.';
