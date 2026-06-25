export const obterOpcoes = (valor) =>
  valor
    ? valor
        .split(",")
        .map((opcao) => opcao.trim())
        .filter(Boolean)
    : [];

export const obterVariacoes = (produto) =>
  Array.isArray(produto?.product_variants)
    ? produto.product_variants.filter((variacao) => variacao.active !== false)
    : [];

const opcoesUnicas = (opcoes) => [...new Set(opcoes.filter(Boolean))];

export const obterTamanhosProduto = (produto) => {
  const variacoes = obterVariacoes(produto);
  return variacoes.length
    ? opcoesUnicas(variacoes.map((variacao) => variacao.size))
    : obterOpcoes(produto?.tamanhos);
};

export const obterCoresProduto = (produto) => {
  const variacoes = obterVariacoes(produto);
  return variacoes.length
    ? opcoesUnicas(variacoes.map((variacao) => variacao.color))
    : obterOpcoes(produto?.cores);
};

export const obterEstampasProduto = (produto) =>
  opcoesUnicas(obterVariacoes(produto).map((variacao) => variacao.print));

export const obterVariacaoSelecionada = (produto, tamanho, cor, estampa) =>
  obterVariacoes(produto).find(
    (variacao) =>
      variacao.size === tamanho &&
      variacao.color === cor &&
      variacao.print === estampa
  );

export const temPrecoPromocional = (produto) => {
  const preco = Number(produto?.preco);
  const promocional = Number(produto?.preco_promocional);

  return (
    Number.isFinite(promocional) &&
    promocional > 0 &&
    promocional < preco
  );
};

export const obterPrecoVenda = (produto) =>
  temPrecoPromocional(produto)
    ? Number(produto.preco_promocional)
    : Number(produto?.preco || 0);
