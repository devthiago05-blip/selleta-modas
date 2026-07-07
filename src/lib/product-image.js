export const LARGURA_IMAGEM_PRODUTO = 1200;
export const ALTURA_IMAGEM_PRODUTO = 1500;
export const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;

const TIPOS_IMAGEM_PERMITIDOS = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validarImagemProduto(arquivo) {
  if (!arquivo || !TIPOS_IMAGEM_PERMITIDOS.has(arquivo.type)) {
    return "A imagem deve ser JPEG, PNG ou WebP.";
  }
  if (arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
    return "A imagem deve ter no máximo 5 MB.";
  }
  return null;
}

export function calcularEncaixeImagem(largura, altura) {
  if (largura <= 0 || altura <= 0) {
    throw new Error("Dimensões de imagem inválidas.");
  }

  const margem = 48;
  const larguraUtil = LARGURA_IMAGEM_PRODUTO - margem * 2;
  const alturaUtil = ALTURA_IMAGEM_PRODUTO - margem * 2;
  const escala = Math.min(larguraUtil / largura, alturaUtil / altura);
  const larguraFinal = Math.round(largura * escala);
  const alturaFinal = Math.round(altura * escala);

  return {
    x: Math.round((LARGURA_IMAGEM_PRODUTO - larguraFinal) / 2),
    y: Math.round((ALTURA_IMAGEM_PRODUTO - alturaFinal) / 2),
    largura: larguraFinal,
    altura: alturaFinal,
  };
}

function carregarImagem(arquivo) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => resolve({ imagem, url });
    imagem.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível processar a imagem selecionada."));
    };
    imagem.src = url;
  });
}

function exportarCanvas(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Não foi possível otimizar a imagem.")),
      "image/webp",
      0.88
    );
  });
}

export async function padronizarImagemProduto(arquivo) {
  const erro = validarImagemProduto(arquivo);
  if (erro) throw new Error(erro);

  const { imagem, url } = await carregarImagem(arquivo);

  try {
    const canvas = document.createElement("canvas");
    canvas.width = LARGURA_IMAGEM_PRODUTO;
    canvas.height = ALTURA_IMAGEM_PRODUTO;

    const contexto = canvas.getContext("2d");
    if (!contexto) throw new Error("O navegador não conseguiu preparar a foto.");

    contexto.fillStyle = "#f8f6f3";
    contexto.fillRect(0, 0, canvas.width, canvas.height);

    const encaixe = calcularEncaixeImagem(
      imagem.naturalWidth,
      imagem.naturalHeight
    );
    contexto.drawImage(
      imagem,
      encaixe.x,
      encaixe.y,
      encaixe.largura,
      encaixe.altura
    );

    const blob = await exportarCanvas(canvas);
    const nomeBase = arquivo.name.replace(/\.[^.]+$/, "") || "produto";
    return new File([blob], `${nomeBase}.webp`, { type: "image/webp" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
