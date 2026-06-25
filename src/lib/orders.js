const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function chamarRpc(funcao, corpo, accessToken) {
  const resposta = await fetch(`${supabaseUrl}/rest/v1/rpc/${funcao}`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${accessToken || supabaseAnonKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(corpo),
  });

  if (!resposta.ok) {
    const erro = await resposta.json().catch(() => ({}));
    throw new Error(erro.message || "Não foi possível concluir a operação.");
  }

  const texto = await resposta.text();
  return texto ? JSON.parse(texto) : null;
}

export function criarPedido({ cliente, pagamento, itens }) {
  return chamarRpc("create_order", {
    p_customer_name: cliente.nome,
    p_customer_phone: cliente.telefone,
    p_customer_address: cliente.endereco,
    p_notes: cliente.observacoes,
    p_payment_method: pagamento,
    p_items: itens.map((item) => ({
      product_id: item.id,
      size: item.tamanho,
      color: item.cor,
      quantity: item.quantidade,
    })),
  });
}

export function acompanharPedido(token, telefone) {
  return chamarRpc("track_order", {
    p_public_token: token,
    p_customer_phone: telefone,
  });
}

export function atualizarPedidoAdmin(
  orderId,
  paymentStatus,
  orderStatus,
  accessToken
) {
  return chamarRpc(
    "admin_update_order",
    {
      p_order_id: orderId,
      p_payment_status: paymentStatus,
      p_order_status: orderStatus,
    },
    accessToken
  );
}
