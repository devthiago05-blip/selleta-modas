export const obterOpcoes = (valor) =>
  valor
    ? valor
        .split(",")
        .map((opcao) => opcao.trim())
        .filter(Boolean)
    : [];

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
