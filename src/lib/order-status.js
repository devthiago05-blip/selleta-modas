export const pagamentoLabels = {
  pending: "Pagamento pendente",
  paid: "Pagamento confirmado",
  pay_on_delivery: "Pagamento na entrega",
  failed: "Pagamento recusado",
  refunded: "Pagamento estornado",
};

export const pedidoLabels = {
  received: "Pedido recebido",
  confirmed: "Pedido confirmado",
  preparing: "Em preparação",
  ready: "Pronto",
  out_for_delivery: "Saiu para entrega",
  delivered: "Entregue",
  canceled: "Cancelado",
};

export const metodoPagamentoLabels = {
  pix: "Pix",
  cash_on_delivery: "Dinheiro na entrega",
  card_on_delivery: "Cartão na entrega",
};

export const statusPagamentoOpcoes = Object.entries(pagamentoLabels);
export const statusPedidoOpcoes = Object.entries(pedidoLabels);
