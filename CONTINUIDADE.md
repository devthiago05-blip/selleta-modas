# Continuidade do projeto Selleta Modas

Atualizado em: 25 de junho de 2026.

## Estado atual

- Stack: React 19, Vite 8, Tailwind CSS 4 e Supabase.
- Branch analisada: `main`.
- URL de produção: https://selleta-modas.vercel.app/
- `npm run lint`: aprovado.
- `npm run build`: aprovado.
- Em 25 de junho de 2026, a URL pública ainda exibia a versão antiga. As mudanças estão somente locais e precisam de commit, push e deploy.
- O commit `96cc480` foi publicado e validado na URL principal em desktop e viewport mobile de 390 px.
- A checagem visual automatizada em localhost foi bloqueada pelo navegador da sessão. Fazer uma revisão manual com `npm run dev`.

## Regra para próximas rodadas

Depois de cada publicação:

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

## Esquema confirmado da tabela `products`

`id`, `products`, `preco`, `estoque`, `imagem`, `categoria`, `descricao`, `tamanhos`, `cores`.

## Risco de segurança que precisa ser verificado

O front-end protege a tela administrativa, mas a segurança real depende das políticas RLS do Supabase.

No painel do Supabase, confirmar:

1. Visitantes anônimos podem apenas ler produtos ativos.
2. `INSERT`, `UPDATE` e `DELETE` exigem usuário autenticado e autorizado.
3. Upload no bucket `produtos` exige autenticação.
4. Não existe chave `service_role` no front-end ou na Vercel com prefixo `VITE_`.
5. Há somente contas administrativas conhecidas no Supabase Auth.

## Próximas melhorias por prioridade

1. Executar `supabase/product-commerce-fields.sql`.
2. Revisar e executar `supabase/rls-policies.sql`; cadastrar o administrador e remover políticas antigas/permissivas do Storage.
3. Adicionar estoque por combinação de tamanho e cor.
4. Criar testes dos fluxos de catálogo, carrinho, login e CRUD.
5. Adicionar imagem Open Graph e dados estruturados de produtos.
6. Configurar `VITE_WHATSAPP_NUMBER` também na Vercel.

## Como continuar em outro chat

Envie este arquivo junto com o projeto e peça:

> Leia `CONTINUIDADE.md`, revise as alterações atuais e continue pela execução validada das políticas RLS e pelos campos de promoção/status. Preserve o que já funciona, faça mudanças pequenas e valide com lint e build.

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```
