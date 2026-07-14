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

export const obterOpcoesDisponiveisProduto = (produto, selecao = {}) => {
  const variacoes = obterVariacoes(produto);

  if (variacoes.length === 0) {
    const tamanhos = obterTamanhosProduto(produto);
    const cores = obterCoresProduto(produto);
    const estampas = obterEstampasProduto(produto);

    return {
      tamanhos,
      cores,
      estampas,
      tamanho: selecao.tamanho || tamanhos[0] || "Único",
      cor: selecao.cor || cores[0] || "Padrão",
      estampa: selecao.estampa || estampas[0] || "Sem estampa",
      variacao: null,
      estoque: Math.max(0, Number(produto?.estoque || 0)),
    };
  }

  const variacoesComEstoque = variacoes.filter(
    (variacao) => Number(variacao.stock) > 0
  );
  const base = variacoesComEstoque.length ? variacoesComEstoque : variacoes;
  const tamanhos = opcoesUnicas(base.map((variacao) => variacao.size));
  const tamanho = tamanhos.includes(selecao.tamanho)
    ? selecao.tamanho
    : tamanhos[0] || "";
  const cores = opcoesUnicas(
    base
      .filter((variacao) => !tamanho || variacao.size === tamanho)
      .map((variacao) => variacao.color)
  );
  const cor = cores.includes(selecao.cor) ? selecao.cor : cores[0] || "";
  const estampas = opcoesUnicas(
    base
      .filter(
        (variacao) =>
          (!tamanho || variacao.size === tamanho) &&
          (!cor || variacao.color === cor)
      )
      .map((variacao) => variacao.print)
  );
  const estampa = estampas.includes(selecao.estampa)
    ? selecao.estampa
    : estampas[0] || "Sem estampa";
  const variacao = obterVariacaoSelecionada(produto, tamanho, cor, estampa);

  return {
    tamanhos,
    cores,
    estampas,
    tamanho,
    cor,
    estampa,
    variacao,
    estoque: Math.max(0, Number(variacao?.stock || 0)),
  };
};

export const obterImagensProduto = (produto) => {
  const imagens = Array.isArray(produto?.imagens)
    ? produto.imagens
    : [];

  return [
    ...new Set(
      [
        produto?.imagem,
        ...imagens,
      ]
        .filter((imagem) => typeof imagem === "string")
        .map((imagem) => imagem.trim())
        .filter(Boolean)
    ),
  ];
};

export const obterImagemPrincipal = (produto) =>
  obterImagensProduto(produto)[0] || "";

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
