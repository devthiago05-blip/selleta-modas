const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export async function carregarCatalogo(signal) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Configuração do catálogo ausente.");
  }

  const parametros = new URLSearchParams({
    select: "*",
    order: "products.asc",
  });

  const resposta = await fetch(
    `${supabaseUrl}/rest/v1/products?${parametros.toString()}`,
    {
      signal,
      headers: {
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`,
      },
    }
  );

  if (!resposta.ok) {
    throw new Error("Não foi possível carregar o catálogo.");
  }

  return resposta.json();
}
