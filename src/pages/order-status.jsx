import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import logoSelleta from "../assets/logo-selleta.png";
import { acompanharPedido } from "../lib/orders";
import {
  metodoPagamentoLabels,
  pagamentoLabels,
  pedidoLabels,
} from "../lib/order-status";
import {
  criarLinkWhatsAppPedido,
  fluxoPedido,
  obterIndicePedido,
  obterMensagemPagamento,
  pedidoEstaCancelado,
} from "../lib/order-ui";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const chaveAcompanhamento = "selleta-last-order";
const whatsappNumero = String(
  import.meta.env.VITE_WHATSAPP_NUMBER || "5585992903028"
).replace(/\D/g, "");

function carregarAcompanhamento() {
  try {
    const salvo = JSON.parse(
      sessionStorage.getItem(chaveAcompanhamento) ||
        localStorage.getItem(chaveAcompanhamento)
    );

    localStorage.removeItem(chaveAcompanhamento);
    if (!salvo?.public_token || !salvo?.telefone) return null;

    const acompanhamento = {
      public_token: salvo.public_token,
      telefone: salvo.telefone,
    };
    sessionStorage.setItem(
      chaveAcompanhamento,
      JSON.stringify(acompanhamento)
    );
    return acompanhamento;
  } catch {
    localStorage.removeItem(chaveAcompanhamento);
    sessionStorage.removeItem(chaveAcompanhamento);
    return null;
  }
}

export default function OrderStatus() {
  const [searchParams] = useSearchParams();
  const [pedidoSalvo] = useState(carregarAcompanhamento);
  const [token, setToken] = useState(
    () => searchParams.get("token") || pedidoSalvo?.public_token || ""
  );
  const [telefone, setTelefone] = useState(
    () => searchParams.get("telefone") || pedidoSalvo?.telefone || ""
  );
  const [pedido, setPedido] = useState(null);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function consultar(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resultado = await acompanharPedido(token, telefone);
      if (!resultado) throw new Error("Pedido não encontrado.");
      setPedido(resultado);
    } catch {
      setErro("Pedido não encontrado ou dados incorretos.");
      setPedido(null);
    } finally {
      setCarregando(false);
    }
  }

  const etapaAtual = pedido ? obterIndicePedido(pedido.order_status) : 0;
  const pedidoCancelado = pedidoEstaCancelado(pedido);
  const linkWhatsApp = criarLinkWhatsAppPedido(whatsappNumero, pedido, "cliente");

  return (
    <main className="mx-auto min-h-screen max-w-2xl px-4 py-8">
      <Link to="/">
        <img src={logoSelleta} alt="Selleta Modas" className="mx-auto w-44" />
      </Link>

      <section className="mt-6 rounded-3xl border bg-white p-5 shadow-sm sm:p-8">
        <p className="text-sm font-bold uppercase tracking-wider text-[#8a5d2b]">
          Acompanhe sua compra
        </p>
        <h1 className="mt-1 text-3xl font-bold">Status do pedido</h1>

        <form onSubmit={consultar} className="mt-6 grid gap-3 sm:grid-cols-2">
          <input
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Código de acompanhamento"
            className="rounded-xl border p-3"
            required
          />
          <input
            type="tel"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
            placeholder="Telefone usado no pedido"
            className="rounded-xl border p-3"
            required
          />
          <button
            type="submit"
            disabled={carregando}
            className="rounded-xl bg-[#8a5d2b] p-3 font-bold text-white sm:col-span-2"
          >
            {carregando ? "Consultando..." : "Consultar pedido"}
          </button>
        </form>

        {erro && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 p-3 text-red-700">
            {erro}
          </p>
        )}

        {pedido && (
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-[#2f2924] to-[#8a5d2b] p-5 text-white">
              <p className="text-sm uppercase tracking-[0.18em] text-[#f4d7aa]">
                Pedido #{pedido.order_number}
              </p>
              <h2 className="mt-1 text-2xl font-bold">
                {pedidoCancelado
                  ? "Pedido cancelado"
                  : pedidoLabels[pedido.order_status]}
              </h2>
              <p className="mt-2 text-sm text-white/75">
                {pedidoCancelado
                  ? "Entre em contato com a equipe se precisar revisar este pedido."
                  : obterMensagemPagamento(pedido)}
              </p>
            </div>

            {!pedidoCancelado && (
              <div className="rounded-2xl border bg-white p-5">
                <h2 className="font-bold">Andamento</h2>
                <div className="mt-4 space-y-3">
                  {fluxoPedido.map((status, index) => {
                    const concluido = index <= etapaAtual;

                    return (
                      <div key={status} className="flex gap-3">
                        <span
                          className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold ${
                            concluido
                              ? "bg-[#8a5d2b] text-white"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p
                            className={`font-semibold ${
                              concluido ? "text-[#2f2924]" : "text-gray-400"
                            }`}
                          >
                            {pedidoLabels[status]}
                          </p>
                          {index === etapaAtual && (
                            <p className="text-sm text-gray-500">
                              Status atual do seu pedido.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="rounded-2xl bg-[#fff7ed] p-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <span className="text-xs uppercase text-gray-500">Pagamento</span>
                  <p className="font-semibold">
                    {pagamentoLabels[pedido.payment_status]}
                  </p>
                </div>
                <div>
                  <span className="text-xs uppercase text-gray-500">Pedido</span>
                  <p className="font-semibold">{pedidoLabels[pedido.order_status]}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-gray-500">Forma</span>
                  <p>{metodoPagamentoLabels[pedido.payment_method]}</p>
                </div>
                <div>
                  <span className="text-xs uppercase text-gray-500">Total</span>
                  <p className="font-bold">{formatarPreco(pedido.subtotal)}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border p-5">
              <h2 className="font-bold">Itens</h2>
              <div className="mt-3 space-y-3">
                {pedido.items.map((item, index) => (
                  <div key={`${item.product_name}-${index}`} className="text-sm">
                    <strong>
                      {item.quantity}× {item.product_name}
                    </strong>
                    <p className="text-gray-500">
                      {item.size} · {item.color} ·{" "}
                      {item.print || "Sem estampa"} ·{" "}
                      {formatarPreco(item.unit_price)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {linkWhatsApp && (
                <a
                  href={linkWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center rounded-xl bg-green-600 p-3 font-bold text-white shadow-sm transition hover:bg-green-700"
                >
                  Falar no WhatsApp
                </a>
              )}
              <Link
                to="/cliente"
                className="inline-flex justify-center rounded-xl border border-[#8a5d2b]/20 p-3 font-bold text-[#8a5d2b] transition hover:bg-[#fff7ed]"
              >
                Ver minha conta
              </Link>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
