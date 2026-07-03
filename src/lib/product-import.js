export const COLUNAS_IMPORTACAO = [
  { letra: "A", titulo: "Nome", exemplo: "Vestido Aurora" },
  { letra: "B", titulo: "Preço", exemplo: "159,90" },
  { letra: "C", titulo: "Estoque P", exemplo: "2" },
  { letra: "D", titulo: "Estoque M", exemplo: "3" },
  { letra: "E", titulo: "Estoque G", exemplo: "2" },
  { letra: "F", titulo: "Estoque GG", exemplo: "1" },
  { letra: "G", titulo: "Cor", exemplo: "Preto" },
  { letra: "H", titulo: "Categoria", exemplo: "Vestido" },
  { letra: "I", titulo: "Preço promocional", exemplo: "139,90" },
  { letra: "J", titulo: "Estampa", exemplo: "Sem estampa" },
  { letra: "K", titulo: "Imagem do produto", exemplo: "https://..." },
  { letra: "L", titulo: "Imagem da estampa", exemplo: "https://..." },
  { letra: "M", titulo: "Descrição", exemplo: "Vestido midi elegante" },
  { letra: "N", titulo: "SKU", exemplo: "VES-AURORA" },
  { letra: "O", titulo: "Ativo", exemplo: "Sim" },
];

const TAMANHOS = ["P", "M", "G", "GG"];

const normalizar = (valor) =>
  String(valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

function numeroDecimal(valor) {
  if (typeof valor === "number") return valor;
  const texto = String(valor ?? "").replace(/R\$|\s/gi, "");
  const normalizado = texto.includes(",")
    ? texto.replace(/\./g, "").replace(",", ".")
    : texto;
  return Number(normalizado);
}

function inteiroNaoNegativo(valor) {
  if (valor === null || valor === undefined || valor === "") return 0;
  const numero = numeroDecimal(valor);
  return Number.isInteger(numero) && numero >= 0 && numero <= 999999
    ? numero
    : null;
}

function ativoDaCelula(valor) {
  if (valor === null || valor === undefined || String(valor).trim() === "") {
    return true;
  }
  const texto = normalizar(valor);
  if (["sim", "true", "1", "ativo"].includes(texto)) return true;
  if (["nao", "false", "0", "inativo"].includes(texto)) return false;
  return null;
}

function urlValida(valor) {
  return (
    typeof valor === "string" &&
    valor.length <= 2048 &&
    (valor.startsWith("https://") || valor.startsWith("/"))
  );
}

export function analisarPlanilhaProdutos(linhas, nomesExistentes = []) {
  const erros = [];
  if (!Array.isArray(linhas) || linhas.length < 2) {
    return { produtos: [], erros: ["A planilha precisa ter cabeçalho e ao menos uma peça."] };
  }

  COLUNAS_IMPORTACAO.forEach((coluna, indice) => {
    if (normalizar(linhas[0]?.[indice]) !== normalizar(coluna.titulo)) {
      erros.push(`Coluna ${coluna.letra}: use o título “${coluna.titulo}”.`);
    }
  });
  if (erros.length) return { produtos: [], erros };

  const linhasComDados = linhas
    .slice(1)
    .map((linha, indice) => ({ linha, numero: indice + 2 }))
    .filter(({ linha }) => linha.some((celula) => String(celula ?? "").trim()));

  if (linhasComDados.length > 500) {
    return { produtos: [], erros: ["Importe no máximo 500 linhas por arquivo."] };
  }

  const existentes = new Set(nomesExistentes.map(normalizar));
  const grupos = new Map();

  for (const { linha, numero } of linhasComDados) {
    const nome = String(linha[0] ?? "").trim();
    const preco = numeroDecimal(linha[1]);
    const estoques = linha.slice(2, 6).map(inteiroNaoNegativo);
    const cor = String(linha[6] ?? "").trim();
    const categoria = String(linha[7] ?? "").trim();
    const promocionalVazio = linha[8] === null || linha[8] === undefined || linha[8] === "";
    const precoPromocional = promocionalVazio ? null : numeroDecimal(linha[8]);
    const estampa = String(linha[9] ?? "").trim() || "Sem estampa";
    const imagemProduto = String(linha[10] ?? "").trim();
    const imagemEstampa = String(linha[11] ?? "").trim();
    const descricao = String(linha[12] ?? "").trim();
    const skuBase = String(linha[13] ?? "").trim();
    const ativo = ativoDaCelula(linha[14]);
    const prefixo = `Linha ${numero}`;

    if (nome.length < 2 || nome.length > 100) erros.push(`${prefixo}: nome inválido.`);
    if (!Number.isFinite(preco) || preco <= 0 || preco > 999999.99) erros.push(`${prefixo}: preço inválido.`);
    if (estoques.some((estoque) => estoque === null)) erros.push(`${prefixo}: estoques devem ser inteiros entre 0 e 999999.`);
    if (!cor || cor.length > 50) erros.push(`${prefixo}: cor obrigatória ou muito longa.`);
    if (!categoria || categoria.length > 50) erros.push(`${prefixo}: categoria obrigatória ou muito longa.`);
    if (precoPromocional !== null && (!Number.isFinite(precoPromocional) || precoPromocional <= 0 || precoPromocional >= preco)) {
      erros.push(`${prefixo}: preço promocional deve ser menor que o preço normal.`);
    }
    if (estampa.length > 80) erros.push(`${prefixo}: estampa muito longa.`);
    if (!urlValida(imagemProduto)) erros.push(`${prefixo}: informe uma imagem HTTPS ou caminho iniciado por /.`);
    if (normalizar(estampa) !== "sem estampa" && !urlValida(imagemEstampa)) {
      erros.push(`${prefixo}: produtos estampados precisam da URL da imagem da estampa.`);
    }
    if (descricao.length > 2000) erros.push(`${prefixo}: descrição deve ter até 2000 caracteres.`);
    if (skuBase.length > 60) erros.push(`${prefixo}: SKU deve ter até 60 caracteres.`);
    if (ativo === null) erros.push(`${prefixo}: use Sim ou Não na coluna Ativo.`);

    const chave = normalizar(nome);
    if (existentes.has(chave)) erros.push(`${prefixo}: “${nome}” já está cadastrado.`);
    if (erros.some((erro) => erro.startsWith(`${prefixo}:`))) continue;

    const assinatura = JSON.stringify({ preco, precoPromocional, categoria, imagemProduto, descricao, ativo });
    let grupo = grupos.get(chave);
    if (!grupo) {
      grupo = { nome, preco, precoPromocional, categoria, imagemProduto, descricao, ativo, assinatura, variantes: [] };
      grupos.set(chave, grupo);
    } else if (grupo.assinatura !== assinatura) {
      erros.push(`${prefixo}: dados gerais diferentes das outras linhas de “${nome}”.`);
      continue;
    }

    for (const [indice, tamanho] of TAMANHOS.entries()) {
      grupo.variantes.push({
        size: tamanho,
        color: cor,
        print: estampa,
        print_image_url: imagemEstampa || null,
        sku: skuBase ? `${skuBase}-${tamanho}`.slice(0, 80) : null,
        stock: estoques[indice],
        active: ativo,
        linha: numero,
      });
    }
  }

  const produtos = [];
  for (const grupo of grupos.values()) {
    const combinacoes = new Set();
    for (const variante of grupo.variantes) {
      const chave = `${normalizar(variante.size)}|${normalizar(variante.color)}|${normalizar(variante.print)}`;
      if (combinacoes.has(chave)) {
        erros.push(`Linha ${variante.linha}: combinação repetida de tamanho, cor e estampa.`);
      }
      combinacoes.add(chave);
    }

    const estoqueTotal = grupo.variantes.reduce((total, variante) => total + variante.stock, 0);
    if (grupo.ativo && estoqueTotal === 0) {
      erros.push(`Produto “${grupo.nome}”: informe estoque em pelo menos um tamanho.`);
    }

    produtos.push({
      dados: {
        products: grupo.nome,
        preco: grupo.preco,
        preco_promocional: grupo.precoPromocional,
        estoque: estoqueTotal,
        imagem: grupo.imagemProduto,
        categoria: grupo.categoria,
        descricao: grupo.descricao,
        tamanhos: TAMANHOS.join(","),
        cores: [...new Set(grupo.variantes.map((variante) => variante.color))].join(","),
        ativo: grupo.ativo,
      },
      variantes: grupo.variantes.map((variante) => ({
        size: variante.size,
        color: variante.color,
        print: variante.print,
        print_image_url: variante.print_image_url,
        sku: variante.sku,
        stock: variante.stock,
        active: variante.active,
      })),
    });
  }

  return { produtos: erros.length ? [] : produtos, erros };
}
