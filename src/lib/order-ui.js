import { pedidoLabels } from "./order-status.js";

export const fluxoPedido = [
  "received",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
];

export const statusPedidoQueExigemPagamento = new Set([
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "delivered",
]);

export function obterIndicePedido(status) {
  const indice = fluxoPedido.indexOf(status);
  return indice >= 0 ? indice : 0;
}

export function pedidoEstaCancelado(pedido) {
  return pedido?.order_status === "canceled";
}

export function pagamentoPixPendente(pedido) {
  return pedido?.payment_method === "pix" && pedido?.payment_status === "pending";
}

export function pedidoPodeAvancarComPagamento(pedido) {
  return !(
    pedido?.payment_method === "pix" &&
    pedido?.payment_status !== "paid" &&
    statusPedidoQueExigemPagamento.has(pedido?.order_status)
  );
}

export function obterMensagemPagamento(pedido) {
  if (pagamentoPixPendente(pedido)) {
    return "Seu Pix ainda está em conferência. Assim que a equipe confirmar, o pedido segue para preparação.";
  }

  if (pedido?.payment_status === "paid") {
    return "Pagamento confirmado. Agora é só acompanhar a preparação do pedido.";
  }

  if (pedido?.payment_status === "pay_on_delivery") {
    return "Pagamento combinado para a entrega. A equipe seguirá com a confirmação do pedido.";
  }

  if (pedido?.payment_status === "failed") {
    return "Pagamento recusado. Fale com a equipe para revisar a forma de pagamento.";
  }

  if (pedido?.payment_status === "refunded") {
    return "Pagamento estornado. Fale com a equipe caso precise de ajuda.";
  }

  return "Acompanhe esta tela para ver as próximas atualizações.";
}

export function obterResumoOperacionalPedido(pedido) {
  if (pedidoEstaCancelado(pedido)) return "Pedido cancelado";
  if (pagamentoPixPendente(pedido)) return "Aguardando confirmação do Pix";
  return pedidoLabels[pedido?.order_status] || "Pedido em acompanhamento";
}

export function normalizarTelefone(valor) {
  const telefone = String(valor || "").replace(/\D/g, "");

  if (telefone.length === 10 || telefone.length === 11) {
    return `55${telefone}`;
  }

  return telefone;
}

export function criarMensagemWhatsAppPedido(pedido, contexto = "cliente") {
  const numero = pedido?.order_number ? `#${pedido.order_number}` : "";

  if (contexto === "admin") {
    return `Olá! Aqui é da Selleta Modas. Estamos falando sobre seu pedido ${numero}.`;
  }

  return `Olá! Gostaria de falar sobre meu pedido ${numero} da Selleta Modas.`;
}

export function criarLinkWhatsAppPedido(numeroWhatsApp, pedido, contexto) {
  const numero = normalizarTelefone(numeroWhatsApp);
  if (!numero || !pedido) return "";

  return `https://wa.me/${numero}?text=${encodeURIComponent(
    criarMensagemWhatsAppPedido(pedido, contexto)
  )}`;
}
