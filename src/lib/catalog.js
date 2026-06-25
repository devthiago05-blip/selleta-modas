const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function carregarCatalogo(signal) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configuração do catálogo ausente.");
  }

  const carregar = (select) => {
    const parametros = new URLSearchParams({
      select,
      order: "products.asc",
    });

    return fetch(`${supabaseUrl}/rest/v1/products?${parametros.toString()}`, {
      signal,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    });
  };

  let resposta = await carregar("*,product_variants(*)");

  if (!resposta.ok && resposta.status === 400) {
    resposta = await carregar("*");
  }

  if (!resposta.ok) {
    throw new Error("Não foi possível carregar o catálogo.");
  }

  return resposta.json();
}
