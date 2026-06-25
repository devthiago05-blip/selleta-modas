export const obterOpcoes = (valor) =>
  valor
    ? valor
        .split(",")
        .map((opcao) => opcao.trim())
        .filter(Boolean)
    : [];
