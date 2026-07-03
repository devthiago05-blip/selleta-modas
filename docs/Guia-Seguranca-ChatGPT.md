# Guia de segurança — Selleta Modas

Este documento serve para continuar a segurança do projeto com o ChatGPT comum. O ChatGPT deve orientar; você executa e devolve os resultados antes da próxima etapa.

## Regras essenciais

- Nunca envie `.env`, senhas, tokens, chave `service_role` ou dados reais de clientes ao ChatGPT.
- Faça uma alteração pequena por vez e mantenha um caminho de reversão.
- Antes de executar SQL, confirme o projeto Supabase selecionado e leia todo o comando.
- Não desative RLS para resolver erros.
- Não remova funções ou permissões de pedidos sem verificar o checkout, pois elas podem ser necessárias ao fluxo público.
- Depois de cada bloco, valide lint, testes, build e as telas afetadas.

## Estado de segurança já confirmado

- RLS está habilitada nas seis tabelas públicas atuais e há policies ativas.
- Não existe chave `service_role` no frontend.
- Confirmação de e-mail está ativa e o JWT expira em 3.600 segundos.
- Upload no bucket `produtos` exige administrador autenticado.
- O bucket limita arquivos a 5 MB e aceita somente JPEG, PNG e WebP.
- O frontend valida tipo e tamanho das imagens antes do upload.
- A Vercel possui CSP e headers contra clickjacking, MIME sniffing e vazamento excessivo de referência.

## Pendências por prioridade

1. Ativar proteção contra senhas vazadas no painel do Supabase.
2. Configurar CAPTCHA e revisar os limites de Auth para login, cadastro e recuperação de senha.
3. Exigir ou oferecer MFA para contas administrativas.
4. Revisar funções `SECURITY DEFINER`, permissões de execução e `search_path` seguro.
5. Reforçar validações e constraints do banco para pedidos, produtos, preços e estoques.
6. Padronizar erros amigáveis sem devolver detalhes internos do Supabase.
7. Reduzir dados pessoais e informações de pedido mantidos no `localStorage`.
8. Criar logs de auditoria e alertas para eventos administrativos e tentativas suspeitas.
9. Repetir a varredura dos 40 itens antes de publicar novas funções ou tabelas.

## Prompt mestre para colar no ChatGPT

```text
Atue como meu orientador sênior de segurança para um e-commerce React, Vite, Vercel e Supabase chamado Selleta Modas.

Você não deve executar nem presumir alterações. Eu executarei todos os passos. Trabalhe em um único bloco pequeno por resposta e aguarde eu colar o resultado antes de continuar.

Em cada bloco:
1. Informe o risco tratado e o resultado esperado.
2. Liste exatamente os arquivos ou configurações afetados.
3. Forneça comandos ou SQL completos, curtos e seguros.
4. Explique como testar e como reverter.
5. Peça somente saídas sem segredos.

Regras obrigatórias:
- Nunca peça conteúdo do .env, senhas, tokens, JWTs ou chaves.
- Nunca coloque service_role no frontend ou em variável VITE_*.
- Nunca desative RLS para corrigir acesso.
- Em policies por usuário, prefira (select auth.uid()) = user_id.
- Crie policies separadas para SELECT, INSERT, UPDATE e DELETE; não use FOR ALL.
- Não use user_metadata para autorização; use app_metadata ou tabela protegida.
- Não execute DROP, TRUNCATE, DELETE sem filtro ou alteração destrutiva sem backup e confirmação explícita.
- Não revogue funções create_order, track_order ou recursos do checkout sem mapear o uso no código e testar compra, pagamento e estoque.
- Preserve o site atual e evite novas dependências.
- Ao alterar index.html, recalcule o hash CSP do JSON-LD existente.
- Valide npm run lint, npm run test e npm run build após mudanças de código.

Estado atual conhecido:
- RLS ativa nas seis tabelas públicas atuais.
- Upload de produtos restrito a administradores, 5 MB, JPEG/PNG/WebP.
- Headers de segurança configurados na Vercel.
- Pendências principais: senhas vazadas, CAPTCHA/rate limits, MFA administrativo, revisão de SECURITY DEFINER, validação no banco, erros, localStorage, auditoria e monitoramento.

Comece pela proteção contra senhas vazadas e CAPTCHA no Supabase. Oriente os cliques exatos no painel atual, explique como testar e pare para aguardar meu retorno.
```

## Consultas de verificação somente leitura

Execute no SQL Editor do Supabase. Elas não alteram dados.

### RLS e quantidade de policies

```sql
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  count(p.policyname) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname
 and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
group by n.nspname, c.relname, c.relrowsecurity
order by c.relname;
```

### Configuração e policies do Storage

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
order by id;

select policyname, roles, cmd, qual, with_check
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
order by policyname;
```

### Funções `SECURITY DEFINER`

```sql
select
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments,
  p.proconfig as settings,
  has_function_privilege('anon', p.oid, 'execute') as anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'execute') as authenticated_can_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname in ('public', 'private')
  and p.prosecdef
order by n.nspname, p.proname;
```

O resultado precisa ser analisado função por função. Uma função pública não é automaticamente vulnerável: o risco depende do propósito, validações, `search_path` e permissões.

## Validação local

No Windows/PowerShell, prefira:

```powershell
npm.cmd install
npm.cmd run dev
npm.cmd run lint
npm.cmd run test
npm.cmd run build
```

Também teste manualmente:

- catálogo e imagens;
- login de cliente e administrador;
- cadastro e edição de produto;
- upload de imagem válida e rejeição de arquivo inválido;
- grade P/M/G/GG e balanço de estoque;
- carrinho, Pix, acompanhamento e atualização de pedido;
- compra pelo WhatsApp.

## Quando repetir a auditoria

- antes de cada release importante;
- depois de criar tabela, view, bucket, RPC ou Edge Function;
- depois de integrar pagamento, e-mail ou outro serviço externo;
- após mudanças em Auth, RLS ou papéis administrativos;
- imediatamente após qualquer incidente ou alerta inesperado.
