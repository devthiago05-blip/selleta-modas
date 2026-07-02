export const TAMANHOS_PADRAO = ["P", "M", "G", "GG"];

export const CORES_COMUNS = [
  ["Preto", "#111111"],
  ["Branco", "#ffffff"],
  ["Off-white", "#f7f2e8"],
  ["Bege", "#d6c6a5"],
  ["Nude", "#d8aa8b"],
  ["Caramelo", "#a96f3f"],
  ["Marrom", "#784421"],
  ["Chocolate", "#4b2c20"],
  ["Cinza", "#8b8b8b"],
  ["Chumbo", "#4b4f54"],
  ["Azul-marinho", "#172554"],
  ["Azul", "#2563eb"],
  ["Azul-claro", "#7dd3fc"],
  ["Jeans", "#4f6f8f"],
  ["Verde", "#15803d"],
  ["Verde-militar", "#596b3c"],
  ["Verde-oliva", "#808000"],
  ["Verde-menta", "#86efac"],
  ["Vermelho", "#dc2626"],
  ["Vinho", "#722f37"],
  ["Bordô", "#800020"],
  ["Rosa", "#ec4899"],
  ["Rosa-claro", "#f9a8d4"],
  ["Pink", "#db2777"],
  ["Lilás", "#c4b5fd"],
  ["Roxo", "#7e22ce"],
  ["Amarelo", "#facc15"],
  ["Mostarda", "#ca8a04"],
  ["Laranja", "#f97316"],
  ["Coral", "#fb7185"],
].map(([nome, hex]) => ({ nome, hex }));

export const SEM_ESTAMPA = "Sem estampa";

export const normalizarOpcao = (valor) =>
  String(valor || "")
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR");

export const chaveVariacao = (tamanho, cor, estampa) =>
  [tamanho, cor, estampa].map(normalizarOpcao).join("|");

export const obterHexCor = (cor) =>
  CORES_COMUNS.find(
    (opcao) => normalizarOpcao(opcao.nome) === normalizarOpcao(cor)
  )?.hex || "#cccccc";

export function gerarCombinacoesGrade({
  tamanhos,
  cores,
  estampas = [],
  estoqueInicial = 1,
}) {
  const opcoesEstampa = estampas.length
    ? estampas
    : [{ nome: SEM_ESTAMPA, imagemUrl: null }];

  return tamanhos.flatMap((size) =>
    cores.flatMap((color) =>
      opcoesEstampa.map((estampa) => ({
        size,
        color,
        print: estampa.nome,
        print_image_url: estampa.imagemUrl || null,
        sku: "",
        stock: String(estoqueInicial),
        active: true,
      }))
    )
  );
}

export function completarGradePadrao(variacoes = [], corPadrao = "Preto") {
  const existentes = Array.isArray(variacoes) ? variacoes : [];
  const grupos = new Map();

  for (const variacao of existentes) {
    const chave = [variacao.color, variacao.print || SEM_ESTAMPA]
      .map(normalizarOpcao)
      .join("|");
    if (!grupos.has(chave)) {
      grupos.set(chave, {
        color: variacao.color,
        print: variacao.print || SEM_ESTAMPA,
        print_image_url: variacao.print_image_url || null,
      });
    }
  }

  if (grupos.size === 0) {
    grupos.set(normalizarOpcao(corPadrao), {
      color: corPadrao,
      print: SEM_ESTAMPA,
      print_image_url: null,
    });
  }

  const resultado = [...existentes];
  for (const grupo of grupos.values()) {
    for (const size of TAMANHOS_PADRAO) {
      const existe = existentes.some(
        (variacao) =>
          chaveVariacao(variacao.size, variacao.color, variacao.print) ===
          chaveVariacao(size, grupo.color, grupo.print)
      );

      if (!existe) {
        resultado.push({
          size,
          color: grupo.color,
          print: grupo.print,
          print_image_url: grupo.print_image_url,
          sku: "",
          stock: 0,
          active: true,
        });
      }
    }
  }

  return resultado;
}
