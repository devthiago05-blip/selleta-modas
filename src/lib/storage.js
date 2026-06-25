import { supabase } from "./supabase";

const BUCKET_PRODUTOS = "produtos";

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
