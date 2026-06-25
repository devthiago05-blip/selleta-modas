# Manual de Operação — Selleta Modas

Versão 1.0 — 25 de junho de 2026
Site: https://selleta-modas.vercel.app/

## 1. Visão geral

O sistema possui áreas separadas para clientes e administradores:

- Loja: `/`
- Área da cliente: `/cliente`
- Acompanhamento sem login: `/pedido`
- Login administrativo: `/login`
- Painel administrativo: `/admin`

Nunca compartilhe a senha administrativa com clientes. A conta de cliente não
possui permissão para alterar produtos, estoque ou pedidos.

## 2. Área da cliente

### Criar conta ou entrar

1. Acesse `https://selleta-modas.vercel.app/cliente`.
2. Selecione “Ainda não tenho conta” para criar um cadastro.
3. Informe nome, e-mail e uma senha com pelo menos seis caracteres.
4. Caso a confirmação de e-mail esteja habilitada no Supabase, confirme o
   cadastro pela mensagem recebida.
5. Para entrar depois, use o mesmo e-mail e senha.

### Consultar pedidos

Após o login, a cliente visualiza os pedidos vinculados à sua conta, incluindo:

- número e valor do pedido;
- forma e situação do pagamento;
- situação atual do pedido;
- produtos, tamanhos, cores e estampas.

### Vincular pedido anterior

Um pedido feito antes do login pode ser vinculado à conta:

1. Abra a área da cliente.
2. Use a seção “Vincular pedido anterior”.
3. Informe o código de acompanhamento e o telefone usado na compra.
4. Clique em “Vincular à minha conta”.

## 3. Compra e carrinho

1. Na loja, use a busca ou os filtros de categoria, tamanho, cor e preço.
2. Abra o produto em “Escolher opções”.
3. Selecione tamanho, cor e estampa disponíveis.
4. Escolha a quantidade respeitando o estoque exibido.
5. Adicione ao carrinho.
6. Finalize pelo WhatsApp ou pelo checkout do site.

O carrinho fica salvo no navegador. Ao trocar de celular ou limpar os dados do
navegador, os itens podem não ser mantidos.

## 4. Pagamentos e acompanhamento

Formas disponíveis:

- Pix: começa como “Pagamento pendente” e deve ser confirmado no painel.
- Dinheiro na entrega: começa como “Pagamento na entrega”.
- Cartão na entrega: começa como “Pagamento na entrega”.
- WhatsApp: a equipe confirma manualmente os detalhes da compra.

Para acompanhar sem conta, acesse `/pedido` e informe o código do pedido e o
telefone utilizado na compra.

Situações de pagamento:

- Pagamento pendente;
- Pagamento confirmado;
- Pagamento na entrega;
- Pagamento recusado;
- Pagamento estornado.

Situações do pedido:

- Pedido recebido;
- Pedido confirmado;
- Em preparação;
- Pronto;
- Saiu para entrega;
- Entregue;
- Cancelado.

## 5. Acesso administrativo

1. Acesse `https://selleta-modas.vercel.app/login`.
2. Informe o e-mail e a senha do administrador.
3. Após entrar, o sistema direciona para `/admin`.

Além de existir no Supabase Auth, o usuário precisa estar cadastrado na tabela
`public.admin_users`. Usuários comuns são redirecionados para a área da cliente.

Para sair com segurança, use o botão “Sair” no cabeçalho do painel.

## 6. Cadastro e edição de produtos

Na guia “Produtos”:

1. Informe nome, categoria, preço e estoque.
2. Preencha preço promocional somente quando for menor que o preço normal.
3. Marque o produto como ativo para exibi-lo na loja.
4. Adicione descrição, tamanhos e cores.
5. Envie uma imagem PNG, JPG ou WebP de até 5 MB.
6. Clique em “Salvar produto”.

Para alterar um produto, clique em “Editar”. Para removê-lo, clique em
“Excluir” e confirme no modal. Antes de excluir, confirme se o produto não
precisa permanecer no histórico operacional.

Produtos inativos ficam ocultos na loja, mas continuam cadastrados.

## 7. Grade, cores, estampas e estoque

Antes de usar a grade, execute no SQL Editor do Supabase:

`supabase/product-variants.sql`

Depois:

1. Salve o produto normalmente.
2. Na lista de produtos, clique em “Editar”.
3. Na seção “Grade de variações”, clique em “+ Adicionar”.
4. Informe tamanho, cor, estampa, SKU opcional, estoque e situação ativa.
5. Crie uma linha para cada combinação comercial.
6. Clique em “Salvar grade”.

Exemplo:

- P / Preto / Floral / estoque 2;
- M / Preto / Floral / estoque 3;
- M / Rosa / Liso / estoque 1.

Não repita exatamente a mesma combinação de tamanho, cor e estampa. Quando há
grade, o estoque total do produto é calculado pela soma das variações ativas.

Ao confirmar um pedido, o sistema reduz o estoque da combinação vendida. Ao
cancelar um pedido que já reservou estoque, a quantidade é devolvida.

## 8. Pedidos, pagamentos e estoque no painel

Na guia “Pedidos”, é possível:

- buscar por pedido, cliente ou telefone;
- filtrar por situação e período;
- consultar itens e variações;
- alterar a situação do pagamento;
- alterar a situação do pedido;
- exportar os dados em CSV.

Fluxo recomendado para Pix:

1. O pedido chega como “Pagamento pendente” e “Pedido recebido”.
2. Confira o recebimento do Pix.
3. Altere o pagamento para “Pagamento confirmado”.
4. Altere o pedido para “Pedido confirmado”.
5. Continue por “Em preparação”, “Pronto”, “Saiu para entrega” e “Entregue”.

O sistema impede a confirmação de um pedido Pix enquanto o pagamento não
estiver marcado como confirmado.

## 9. Relatórios

O painel apresenta:

- faturamento confirmado;
- total de pedidos no período;
- quantidade de Pix pendentes;
- ticket médio pago;
- produtos mais vendidos;
- exportação CSV.

O faturamento considera pedidos com pagamento confirmado. Use os filtros antes
de exportar para gerar relatórios de períodos específicos.

## 10. Segurança e boas práticas

- Use senha administrativa exclusiva e forte.
- Não coloque a chave `service_role` no front-end ou em variável `VITE_`.
- Revise periodicamente os usuários de `admin_users`.
- Mantenha as políticas RLS do Supabase ativas.
- Confirme que visitantes somente leem produtos ativos.
- Restrinja cadastro, edição, exclusão e upload aos administradores.
- Não compartilhe códigos, senhas ou chaves em mensagens públicas.
- Faça backup antes de grandes alterações no banco.

## 11. Configuração e manutenção

Variáveis principais:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_WHATSAPP_NUMBER`
- `VITE_DIRECT_CHECKOUT_ENABLED`
- `VITE_PIX_KEY`
- `VITE_PIX_RECEIVER`

Comandos de validação:

```bash
npm install
npm run dev
npm run lint
npm run test
npm run build
```

Depois de publicar, valide a loja, o login, a área da cliente, o carrinho, o
checkout e o painel em computador e celular.

## 12. Solução rápida de problemas

### Login administrativo volta para a área da cliente

O usuário existe no Supabase Auth, mas não está autorizado em
`public.admin_users`.

### A grade não aparece

Execute `supabase/product-variants.sql`, recarregue o painel e edite novamente
o produto.

### Produto não aparece na loja

Confira se está ativo, se possui preço válido e se a consulta pública do
Supabase permite a leitura.

### Pix não permite confirmar o pedido

Primeiro altere o pagamento para “Pagamento confirmado”; depois confirme o
pedido.

### Estoque não corresponde à grade

Revise as variações ativas e seus estoques. O total é a soma das combinações
ativas.

### Pedido não aparece na conta da cliente

Confirme se a compra foi feita enquanto ela estava conectada ou use “Vincular
pedido anterior” com código e telefone corretos.

## 13. Suporte e continuidade

O arquivo `CONTINUIDADE.md` registra o estado técnico e os próximos passos do
projeto. Consulte-o antes de novas alterações.

Prioridades futuras: Pix automático com webhook, cálculo de frete, páginas
legais, galeria de imagens, analytics, monitoramento e testes E2E.
