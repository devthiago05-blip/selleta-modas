# Continuidade do projeto Selleta Modas

Atualizado em: 2 de julho de 2026.

## Estado atual

- Stack: React 19, Vite 8, Tailwind CSS 4 e Supabase.
- Branch analisada: `main`.
- URL de produção: https://selleta-modas.vercel.app/
- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- Verificação atual: `public.product_variants` está acessível pela API REST do Supabase.
- O painel administrativo está disponível em `/login` e protegido por Supabase Auth + `admin_users`.
- Checkout próprio, área da cliente, pedidos, status e relatórios administrativos estão ativos.
- A grade por tamanho, cor, estampa e estoque por combinação está ativa no código e no Supabase.
- Auditoria do Supabase confirmou RLS nas tabelas principais e corrigiu privilégios anônimos das funções administrativas.
- O editor de grade oferece P/M/G/GG, 30 cores comuns, gerador de combinações e imagem opcional por estampa.
- O painel possui Balanço de estoque por referência, cor, estampa e quantidades P/M/G/GG, com histórico auditável.
- A vitrine foi modularizada, ganhou hero profissional, filtros responsivos, cards com tamanhos/cores e comunicação coerente entre checkout e WhatsApp.
- SEO técnico inclui favicon da marca, manifesto, sitemap e metadados sociais; o layout possui proteção global contra rolagem horizontal.

## Regra para próximas rodadas

Toda rodada com alteração deve terminar com commit, push para `main` e
verificação da publicação no Vercel. Depois de cada publicação:

1. Abrir `https://selleta-modas.vercel.app/`.
2. Confirmar visualmente a funcionalidade alterada.
3. Testar a versão mobile.
4. Conferir catálogo, carrinho, WhatsApp e console do navegador.
5. Não considerar a rodada publicada até a URL principal refletir a mudança.

## Alterações já realizadas

- Corrigido o painel para usar a coluna real `products` da tabela do Supabase.
- Removidos `alert`, `window.confirm`, logs de depuração e função de logout duplicada.
- Adicionados feedback visual, loading, validação de formulário e modal de exclusão.
- Upload administrativo limitado a PNG/JPG/WebP e 5 MB.
- Painel não renderiza conteúdo antes da validação da sessão.
- Loja ganhou hero, benefícios, busca, filtro de categoria, estados de loading/erro/vazio e melhor responsividade.
- Carrinho limita quantidade ao estoque e gera a mensagem do WhatsApp com codificação correta.
- Adicionados SEO básico, idioma `pt-BR`, Open Graph, lazy loading e formatação monetária.
- Removido o cliente Supabase antigo com configuração fixa.
- Adicionados `.env.example` e validação das variáveis de ambiente.
- Adicionado modal de produto com opções, informações de entrega e troca.
- Adicionados filtros por tamanho, cor e preço máximo.
- Carrinho salvo no `localStorage`.
- Número comercial do WhatsApp configurável por variável de ambiente.
- Criado `supabase/rls-policies.sql` para proteger produtos e uploads por lista de administradores.
- Criado `supabase/product-commerce-fields.sql` para preço promocional e status ativo.
- Painel preparado para limpar imagens antigas após edição/exclusão.
- Adicionados dados estruturados `ClothingStore`, `ItemList` e `Product`.
- Adicionados testes unitários sem dependências novas para opções e preços.
- Catálogo simplificado com cards focados em imagem, nome, preço e conversão.
- Criado cabeçalho fixo com navegação e carrinho integrado.
- Adicionada seção explicando o processo de compra.
- Rotas de login/admin carregadas sob demanda para reduzir o JavaScript inicial.
- Adicionada página 404 alinhada à identidade da marca.
- Catálogo público passou a usar a API REST do Supabase; o SDK completo fica restrito às rotas administrativas.
- Preparado checkout próprio com Pix manual, dinheiro/cartão na entrega e acompanhamento.
- Preparado painel de pedidos com confirmação de pagamento e evolução de status.
- Criado `supabase/orders.sql`; o checkout permanece desativado até a migração e configuração.
- Criado `supabase/orders-uuid-client-fix.sql` para corrigir instalações com `product_id bigint`.
- Correção UUID executada com sucesso no Supabase em 25 de junho de 2026.
- Pedido técnico Pix #2 criado e acompanhado com status `pending/received`, sem redução de estoque.
- Adicionada área da cliente com cadastro, login, histórico e vínculo de pedidos anteriores.
- Adicionados relatórios administrativos, filtros, métricas e exportação CSV.
- Adicionado cadastro administrativo de grade com tamanho, cor, estampa, SKU, estoque e status por combinação.
- Catálogo, carrinho, WhatsApp, checkout e pedidos passaram a transportar a estampa e o identificador da variação.
- Estoque da grade é consolidado no produto e reservado/restaurado na combinação correta ao atualizar o pedido.
- Criado `public/docs/Manual-Selleta-Modas.pdf`, acompanhado da versão editável em Markdown.
- Criada a página `/politicas` com regras de troca, entrega, privacidade e compra.
- Checkout passou a informar que o frete não está no subtotal e exige aceite das políticas.
- Grade passou a impedir salvamento totalmente zerado, gerar combinações e mostrar miniaturas somente quando o produto possui estampa.
- Removida a tabela vazia e não utilizada `public.grade_templates`, eliminando o erro crítico de RLS apontado pelo Supabase.
- Corrigido o erro de grade causado pela tentativa de salvar um produto já excluído; o editor agora prepara P/M/G/GG por padrão.
- Adicionada a guia Balanço para substituir quantidades por tamanho e registrar cada diferença de estoque.
- Frontend da loja reorganizado em componentes reutilizáveis, com rodapé comercial, guia de compra atualizado e refinamento mobile-first.

## Esquema principal

`id`, `products`, `preco`, `estoque`, `imagem`, `categoria`, `descricao`, `tamanhos`, `cores`.

A tabela `product_variants` contém:

`id`, `product_id`, `size`, `color`, `print`, `print_image_url`, `sku`, `stock`, `active`.

## Risco de segurança que precisa ser verificado

O front-end protege a tela administrativa, mas a segurança real depende das políticas RLS do Supabase.

No painel do Supabase, confirmar:

1. Visitantes anônimos podem apenas ler produtos ativos.
2. `INSERT`, `UPDATE` e `DELETE` exigem usuário autenticado e autorizado.
3. Upload no bucket `produtos` exige autenticação.
4. Não existe chave `service_role` no front-end ou na Vercel com prefixo `VITE_`.
5. Há somente contas administrativas conhecidas no Supabase Auth.
6. Ativar a proteção contra senhas vazadas em Authentication > Password Security.

## Próximas melhorias por prioridade

1. Entrar em `/login`, editar um produto e cadastrar sua grade.
2. Testar um pedido com variação e confirmar/cancelar no painel para validar o estoque.
3. Integrar provedor de Pix com QR Code e webhook para confirmação automática.
4. Fazer auditoria final das políticas RLS, analytics, monitoramento e testes E2E.

O cálculo de frete ficará fora do escopo por enquanto. O checkout não soma frete ao subtotal.

## Como continuar em outro chat

Envie este arquivo junto com o projeto e peça:

> Leia `CONTINUIDADE.md`, teste a grade no painel e continue pelas melhorias de Pix automático e auditoria final. Mantenha o cálculo de frete fora do escopo, preserve o que já funciona e valide com lint, testes e build.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```
