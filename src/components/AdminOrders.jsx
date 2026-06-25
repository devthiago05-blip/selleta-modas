import { useCallback, useEffect, useState } from "react";
import {
  metodoPagamentoLabels,
  pagamentoLabels,
  pedidoLabels,
  statusPagamentoOpcoes,
  statusPedidoOpcoes,
} from "../lib/order-status";
import { atualizarPedidoAdmin } from "../lib/orders";
import { supabase } from "../lib/supabase";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function AdminOrders() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState(null);

  const carregarPedidos = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setIndisponivel(
        error.code === "42P01" ||
          error.message.toLowerCase().includes("orders")
      );
      setErro("Não foi possível carregar os pedidos.");
      setCarregando(false);
      return;
    }

    setPedidos(data || []);
    setIndisponivel(false);
    setCarregando(false);
  }, []);

  useEffect(() => {
    const agendamento = window.setTimeout(carregarPedidos, 0);

    return () => window.clearTimeout(agendamento);
  }, [carregarPedidos]);

  function alterarLocal(id, campo, valor) {
    setPedidos((atuais) =>
      atuais.map((pedido) =>
        pedido.id === id ? { ...pedido, [campo]: valor } : pedido
      )
    );
  }

  async function salvarStatus(pedido) {
    setSalvandoId(pedido.id);
    setErro("");

    const {
      data: { session },
    } = await supabase.auth.getSession();

    try {
      await atualizarPedidoAdmin(
        pedido.id,
        pedido.payment_status,
        pedido.order_status,
        session?.access_token
      );
      await carregarPedidos();
    } catch (error) {
      setErro(error.message);
    } finally {
      setSalvandoId(null);
    }
  }

  if (carregando) {
    return <p className="text-gray-500">Carregando pedidos...</p>;
  }

  if (indisponivel) {
    return (
      <div className="rounded-2xl bg-amber-50 p-6 text-amber-800">
        Execute `supabase/orders.sql` para ativar pedidos e pagamentos.
      </div>
    );
  }

  return (
    <section>
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Pedidos</h2>
          <p className="text-sm text-gray-500">
            Confirme pagamentos e acompanhe a preparação.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setErro("");
            carregarPedidos();
          }}
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Atualizar
        </button>
      </div>

      {erro && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">
          {erro}
        </p>
      )}

      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
          Nenhum pedido recebido.
        </div>
      ) : (
        <div className="space-y-4">
          {pedidos.map((pedido) => (
            <article key={pedido.id} className="rounded-2xl border bg-white p-5 shadow-sm">
              <div className="flex flex-col justify-between gap-3 sm:flex-row">
                <div>
                  <p className="text-sm font-bold text-[#8a5d2b]">
                    Pedido #{pedido.order_number}
                  </p>
                  <h3 className="text-lg font-bold">{pedido.customer_name}</h3>
                  <p className="text-sm text-gray-500">
                    {pedido.customer_phone} · {pedido.customer_address || "Sem endereço"}
                  </p>
                </div>
                <div className="sm:text-right">
                  <p className="text-lg font-bold">{formatarPreco(pedido.subtotal)}</p>
                  <p className="text-sm text-gray-500">
                    {metodoPagamentoLabels[pedido.payment_method]}
                  </p>
                </div>
              </div>

              <div className="mt-4 rounded-xl bg-gray-50 p-4 text-sm">
                {pedido.order_items?.map((item) => (
                  <p key={item.id}>
                    {item.quantity}× {item.product_name} — {item.size}/{item.color}
                  </p>
                ))}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                    Pagamento
                  </span>
                  <select
                    value={pedido.payment_status}
                    onChange={(e) =>
                      alterarLocal(pedido.id, "payment_status", e.target.value)
                    }
                    className="w-full rounded-lg border p-2"
                  >
                    {statusPagamentoOpcoes.map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  <span className="mb-1 block text-xs font-semibold uppercase text-gray-500">
                    Pedido
                  </span>
                  <select
                    value={pedido.order_status}
                    onChange={(e) =>
                      alterarLocal(pedido.id, "order_status", e.target.value)
                    }
                    className="w-full rounded-lg border p-2"
                  >
                    {statusPedidoOpcoes.map(([valor, label]) => (
                      <option key={valor} value={valor}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => salvarStatus(pedido)}
                  disabled={salvandoId === pedido.id}
                  className="self-end rounded-lg bg-[#8a5d2b] px-4 py-2 font-bold text-white"
                >
                  {salvandoId === pedido.id ? "Salvando..." : "Salvar"}
                </button>
              </div>

              <p className="mt-3 text-xs text-gray-500">
                Atual: {pagamentoLabels[pedido.payment_status]} ·{" "}
                {pedidoLabels[pedido.order_status]}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
