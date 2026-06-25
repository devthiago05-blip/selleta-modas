import { useCallback, useEffect, useMemo, useState } from "react";
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

const referenciaRelatorio = Date.now();

export default function AdminOrders() {
  const [pedidos, setPedidos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [indisponivel, setIndisponivel] = useState(false);
  const [erro, setErro] = useState("");
  const [salvandoId, setSalvandoId] = useState(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [periodo, setPeriodo] = useState("30");

  const carregarPedidos = useCallback(async () => {
    const { data, error } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(500);

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

  const pedidosFiltrados = useMemo(() => {
    const inicio =
      periodo === "todos"
        ? null
        : new Date(
            referenciaRelatorio - Number(periodo) * 24 * 60 * 60 * 1000
          );
    const termo = busca.trim().toLowerCase();

    return pedidos.filter((pedido) => {
      const correspondePeriodo =
        !inicio || new Date(pedido.created_at) >= inicio;
      const correspondeStatus =
        !filtroStatus ||
        pedido.order_status === filtroStatus ||
        pedido.payment_status === filtroStatus;
      const correspondeBusca =
        !termo ||
        pedido.customer_name?.toLowerCase().includes(termo) ||
        pedido.customer_phone?.includes(termo) ||
        String(pedido.order_number).includes(termo);

      return correspondePeriodo && correspondeStatus && correspondeBusca;
    });
  }, [busca, filtroStatus, pedidos, periodo]);

  const relatorio = useMemo(() => {
    const pagos = pedidosFiltrados.filter(
      (pedido) => pedido.payment_status === "paid"
    );
    const faturamento = pagos.reduce(
      (total, pedido) => total + Number(pedido.subtotal),
      0
    );
    const pendentesPix = pedidosFiltrados.filter(
      (pedido) =>
        pedido.payment_method === "pix" &&
        pedido.payment_status === "pending"
    ).length;
    const itens = new Map();

    pedidosFiltrados
      .filter((pedido) => pedido.order_status !== "canceled")
      .flatMap((pedido) => pedido.order_items || [])
      .forEach((item) => {
        const atual = itens.get(item.product_name) || 0;
        itens.set(item.product_name, atual + Number(item.quantity));
      });

    const maisVendidos = [...itens.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      faturamento,
      pedidos: pedidosFiltrados.length,
      pendentesPix,
      ticketMedio: pagos.length ? faturamento / pagos.length : 0,
      maisVendidos,
    };
  }, [pedidosFiltrados]);

  function exportarCsv() {
    const cabecalho = [
      "pedido",
      "data",
      "cliente",
      "telefone",
      "pagamento",
      "status_pagamento",
      "status_pedido",
      "total",
    ];
    const linhas = pedidosFiltrados.map((pedido) => [
      pedido.order_number,
      new Date(pedido.created_at).toLocaleString("pt-BR"),
      pedido.customer_name,
      pedido.customer_phone,
      metodoPagamentoLabels[pedido.payment_method],
      pagamentoLabels[pedido.payment_status],
      pedidoLabels[pedido.order_status],
      Number(pedido.subtotal).toFixed(2),
    ]);
    const csv = [cabecalho, ...linhas]
      .map((linha) =>
        linha
          .map((valor) => `"${String(valor ?? "").replaceAll('"', '""')}"`)
          .join(",")
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `pedidos-selleta-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

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
        <div className="flex gap-2">
          <button
            type="button"
            onClick={exportarCsv}
            disabled={pedidosFiltrados.length === 0}
            className="rounded-lg border px-4 py-2 text-sm font-semibold"
          >
            Exportar CSV
          </button>
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
      </div>

      {erro && (
        <p role="alert" className="mb-4 rounded-xl bg-red-50 p-3 text-red-700">
          {erro}
        </p>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Faturamento confirmado", formatarPreco(relatorio.faturamento)],
          ["Pedidos no período", relatorio.pedidos],
          ["Pix pendentes", relatorio.pendentesPix],
          ["Ticket médio pago", formatarPreco(relatorio.ticketMedio)],
        ].map(([titulo, valor]) => (
          <div key={titulo} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">{titulo}</p>
            <p className="mt-1 text-2xl font-bold text-[#8a5d2b]">{valor}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 grid gap-3 rounded-2xl border bg-white p-4 md:grid-cols-3">
        <input
          type="search"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar pedido, cliente ou telefone"
          className="rounded-lg border p-3"
        />
        <select
          value={filtroStatus}
          onChange={(e) => setFiltroStatus(e.target.value)}
          className="rounded-lg border p-3"
        >
          <option value="">Todos os status</option>
          {statusPagamentoOpcoes.map(([valor, label]) => (
            <option key={`pag-${valor}`} value={valor}>
              Pagamento: {label}
            </option>
          ))}
          {statusPedidoOpcoes.map(([valor, label]) => (
            <option key={`ped-${valor}`} value={valor}>
              Pedido: {label}
            </option>
          ))}
        </select>
        <select
          value={periodo}
          onChange={(e) => setPeriodo(e.target.value)}
          className="rounded-lg border p-3"
        >
          <option value="7">Últimos 7 dias</option>
          <option value="30">Últimos 30 dias</option>
          <option value="90">Últimos 90 dias</option>
          <option value="todos">Todo o período</option>
        </select>
      </div>

      {relatorio.maisVendidos.length > 0 && (
        <div className="mb-6 rounded-2xl border bg-white p-5">
          <h3 className="font-bold">Produtos mais vendidos</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {relatorio.maisVendidos.map(([produto, quantidade], index) => (
              <div key={produto} className="flex justify-between rounded-lg bg-gray-50 p-3 text-sm">
                <span>{index + 1}. {produto}</span>
                <strong>{quantidade} un.</strong>
              </div>
            ))}
          </div>
        </div>
      )}

      {pedidos.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
          Nenhum pedido recebido.
        </div>
      ) : pedidosFiltrados.length === 0 ? (
        <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
          Nenhum pedido corresponde aos filtros.
        </div>
      ) : (
        <div className="space-y-4">
          {pedidosFiltrados.map((pedido) => (
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
                    {item.quantity}× {item.product_name} — {item.size}/
                    {item.color}/{item.print || "Sem estampa"}
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
