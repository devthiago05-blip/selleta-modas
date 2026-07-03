import { supabase } from "./supabase";

const BUCKET_PRODUTOS = "produtos";
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024;
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

export async function enviarImagemProduto(arquivo, pasta = "") {
  const erroValidacao = validarImagemProduto(arquivo);
  if (erroValidacao) {
    return { data: null, error: new Error(erroValidacao) };
  }

  const nomeSeguro = arquivo.name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]/g, "-");
  const prefixo = pasta ? `${pasta.replace(/^\/+|\/+$/g, "")}/` : "";
  const nomeArquivo = `${prefixo}${Date.now()}-${crypto.randomUUID()}-${nomeSeguro}`;
  const { error } = await supabase.storage
    .from(BUCKET_PRODUTOS)
    .upload(nomeArquivo, arquivo, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) return { data: null, error };

  const { data } = supabase.storage
    .from(BUCKET_PRODUTOS)
    .getPublicUrl(nomeArquivo);

  return { data: { publicUrl: data.publicUrl }, error: null };
}

export function obterCaminhoImagemProduto(url) {
  if (!url) return null;

  try {
    const caminho = decodeURIComponent(new URL(url).pathname);
    const marcador = `/storage/v1/object/public/${BUCKET_PRODUTOS}/`;
    const inicio = caminho.indexOf(marcador);

    if (inicio === -1) return null;

    return caminho.slice(inicio + marcador.length);
  } catch {
    return null;
  }
}

export async function removerImagemProduto(url) {
  const caminho = obterCaminhoImagemProduto(url);

  if (!caminho) return { error: null };

  return supabase.storage.from(BUCKET_PRODUTOS).remove([caminho]);
}
