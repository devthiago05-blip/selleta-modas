import { useCallback, useEffect, useMemo, useState } from "react";
import {
  metodoPagamentoLabels,
  pagamentoLabels,
  pedidoLabels,
} from "../lib/order-status";
import { obterImagensProduto } from "../lib/product";
import { supabase } from "../lib/supabase";

const LIMITE_ESTOQUE_BAIXO = 2;

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function obterAlertasEstoque(produtos) {
  return produtos.flatMap((produto) => {
    const variacoes = Array.isArray(produto.product_variants)
      ? produto.product_variants.filter((variacao) => variacao.active !== false)
      : [];

    if (variacoes.length === 0) {
      const estoque = Number(produto.estoque || 0);

      return estoque <= LIMITE_ESTOQUE_BAIXO
        ? [
            {
              produto,
              chave: produto.id,
              descricao: "Estoque simples",
              estoque,
            },
          ]
        : [];
    }

    return variacoes
      .filter((variacao) => Number(variacao.stock || 0) <= LIMITE_ESTOQUE_BAIXO)
      .map((variacao) => ({
        produto,
        chave: `${produto.id}-${variacao.id}`,
        descricao: `${variacao.size} / ${variacao.color} / ${
          variacao.print || "Sem estampa"
        }`,
        estoque: Number(variacao.stock || 0),
      }));
  });
}

export default function AdminDashboard({
  produtos,
  onEditarProduto,
  onIrParaSecao,
}) {
  const [pedidos, setPedidos] = useState([]);
  const [carregandoPedidos, setCarregandoPedidos] = useState(true);
  const [pedidosIndisponiveis, setPedidosIndisponiveis] = useState(false);
  const [inicio30Dias] = useState(
    () => Date.now() - 30 * 24 * 60 * 60 * 1000
  );

  const carregarPedidos = useCallback(async () => {
    setCarregandoPedidos(true);
    const { data, error } = await supabase
      .from("orders")
      .select(
        "id,order_number,customer_name,payment_method,payment_status,order_status,subtotal,created_at"
      )
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      setPedidos([]);
      setPedidosIndisponiveis(true);
      setCarregandoPedidos(false);
      return;
    }

    setPedidos(data || []);
    setPedidosIndisponiveis(false);
    setCarregandoPedidos(false);
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregarPedidos);
  }, [carregarPedidos]);

  const resumo = useMemo(() => {
    const produtosAtivos = produtos.filter((produto) => produto.ativo !== false);
    const produtosSemFoto = produtosAtivos.filter(
      (produto) => obterImagensProduto(produto).length === 0
    );
    const alertasEstoque = obterAlertasEstoque(produtosAtivos).sort(
      (a, b) => a.estoque - b.estoque
    );
    const pedidosRecentes = pedidos.filter(
      (pedido) => new Date(pedido.created_at).getTime() >= inicio30Dias
    );
    const pedidosAbertos = pedidos.filter(
      (pedido) =>
        !["delivered", "canceled"].includes(pedido.order_status || "")
    );
    const pixPendentes = pedidos.filter(
      (pedido) =>
        pedido.payment_method === "pix" && pedido.payment_status === "pending"
    );
    const faturamento30Dias = pedidosRecentes
      .filter((pedido) => pedido.payment_status === "paid")
      .reduce((total, pedido) => total + Number(pedido.subtotal || 0), 0);

    return {
      produtosAtivos: produtosAtivos.length,
      produtosSemFoto,
      alertasEstoque,
      pedidosAbertos,
      pixPendentes,
      faturamento30Dias,
    };
  }, [inicio30Dias, pedidos, produtos]);

  const cards = [
    ["Produtos ativos", resumo.produtosAtivos],
    ["Estoque baixo", resumo.alertasEstoque.length],
    ["Pedidos abertos", resumo.pedidosAbertos.length],
    ["Pix pendentes", resumo.pixPendentes.length],
    ["Faturamento 30 dias", formatarPreco(resumo.faturamento30Dias)],
  ];

  return (
    <section className="space-y-6">
      <div className="rounded-[2rem] bg-gradient-to-br from-[#2f2924] to-[#8a5d2b] p-6 text-white shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#f4d7aa]">
          Visão geral
        </p>
        <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
          Painel da Selleta Modas
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-white/80">
          Acompanhe estoque, pedidos pendentes e pontos que precisam de ação.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onIrParaSecao("produtos")}
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#70491f]"
          >
            Cadastrar produto
          </button>
          <button
            type="button"
            onClick={() => onIrParaSecao("balanco")}
            className="rounded-full border border-white/30 px-4 py-2 text-sm font-bold text-white"
          >
            Ajustar estoque
          </button>
          <button
            type="button"
            onClick={() => onIrParaSecao("pedidos")}
            className="rounded-full border border-white/30 px-4 py-2 text-sm font-bold text-white"
          >
            Ver pedidos
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([titulo, valor]) => (
          <article key={titulo} className="rounded-2xl border bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold uppercase text-gray-500">
              {titulo}
            </p>
            <p className="mt-1 text-2xl font-bold text-[#8a5d2b]">{valor}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Atenção no estoque</h3>
              <p className="text-sm text-gray-500">
                Combinações com {LIMITE_ESTOQUE_BAIXO} unidade(s) ou menos.
              </p>
            </div>
            <button
              type="button"
              onClick={() => onIrParaSecao("balanco")}
              className="rounded-lg border px-3 py-2 text-sm font-semibold"
            >
              Balanço
            </button>
          </div>

          {resumo.alertasEstoque.length === 0 ? (
            <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-700">
              Nenhum alerta de estoque baixo agora.
            </p>
          ) : (
            <div className="space-y-2">
              {resumo.alertasEstoque.slice(0, 8).map((alerta) => (
                <div
                  key={alerta.chave}
                  className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 p-3 text-sm"
                >
                  <div>
                    <strong className="block">{alerta.produto.products}</strong>
                    <span className="text-gray-500">{alerta.descricao}</span>
                  </div>
                  <div className="text-right">
                    <strong
                      className={
                        alerta.estoque === 0 ? "text-red-700" : "text-amber-700"
                      }
                    >
                      {alerta.estoque} un.
                    </strong>
                    <button
                      type="button"
                      onClick={() => onEditarProduto(alerta.produto)}
                      className="mt-1 block text-xs font-semibold text-[#8a5d2b]"
                    >
                      Editar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold">Pedidos recentes</h3>
              <p className="text-sm text-gray-500">
                Status comercial dos últimos pedidos.
              </p>
            </div>
            <button
              type="button"
              onClick={carregarPedidos}
              className="rounded-lg border px-3 py-2 text-sm font-semibold"
            >
              Atualizar
            </button>
          </div>

          {carregandoPedidos ? (
            <p className="text-sm text-gray-500">Carregando pedidos...</p>
          ) : pedidosIndisponiveis ? (
            <p className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              Pedidos ainda não estão disponíveis neste ambiente.
            </p>
          ) : pedidos.length === 0 ? (
            <p className="rounded-xl bg-gray-50 p-4 text-sm text-gray-500">
              Nenhum pedido recebido ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {pedidos.slice(0, 5).map((pedido) => (
                <div key={pedido.id} className="rounded-xl bg-gray-50 p-3 text-sm">
                  <div className="flex justify-between gap-3">
                    <strong>#{pedido.order_number}</strong>
                    <span>{formatarPreco(pedido.subtotal)}</span>
                  </div>
                  <p className="text-gray-600">{pedido.customer_name}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    {metodoPagamentoLabels[pedido.payment_method]} ·{" "}
                    {pagamentoLabels[pedido.payment_status]} ·{" "}
                    {pedidoLabels[pedido.order_status]}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {resumo.produtosSemFoto.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <h3 className="font-bold">Produtos sem foto</h3>
          <p className="mt-1 text-sm">
            Produtos sem imagem reduzem confiança e conversão. Priorize corrigir:
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {resumo.produtosSemFoto.slice(0, 8).map((produto) => (
              <button
                key={produto.id}
                type="button"
                onClick={() => onEditarProduto(produto)}
                className="rounded-full bg-white px-3 py-1 text-sm font-semibold"
              >
                {produto.products}
              </button>
            ))}
          </div>
        </section>
      )}
    </section>
  );
}
