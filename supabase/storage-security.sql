-- Selleta Modas - endurecimento do bucket público de imagens de produtos.
-- O bucket continua público apenas para leitura das imagens do catálogo.

begin;

drop policy if exists "Permitir upload 1ifiba2_0" on storage.objects;

update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array[
      'image/jpeg',
      'image/png',
      'image/webp'
    ]::text[]
where id = 'produtos';

commit;

-- Resultado esperado: somente policies administrativas podem escrever.
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;

select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'produtos';

