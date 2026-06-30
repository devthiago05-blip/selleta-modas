-- Ajustes de privilegios identificados pelo Security Advisor do Supabase.

begin;

revoke all on function public.admin_replace_product_variants(uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.admin_replace_product_variants(uuid, jsonb)
to authenticated;

revoke all on function public.admin_update_order(uuid, text, text)
from public, anon, authenticated;
grant execute on function public.admin_update_order(uuid, text, text)
to authenticated;

revoke all on function public.claim_order(uuid, text)
from public, anon, authenticated;
grant execute on function public.claim_order(uuid, text)
to authenticated;

revoke all on function public.create_order(text, text, text, text, text, jsonb)
from public, anon, authenticated;
grant execute on function public.create_order(text, text, text, text, text, jsonb)
to anon, authenticated;

revoke all on function public.track_order(uuid, text)
from public, anon, authenticated;
grant execute on function public.track_order(uuid, text)
to anon, authenticated;

drop policy if exists "Permitir visualização 1ifiba2_0" on storage.objects;

commit;
