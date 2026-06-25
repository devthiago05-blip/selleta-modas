import { useState } from "react";
import { Link } from "react-router-dom";
import { criarPedido } from "../lib/orders";
import { obterPrecoVenda } from "../lib/product";

const pixKey = import.meta.env.VITE_PIX_KEY || "";
const pixReceiver = import.meta.env.VITE_PIX_RECEIVER || "Selleta Modas";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function CheckoutModal({ carrinho, total, onClose, onSuccess }) {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [endereco, setEndereco] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [pagamento, setPagamento] = useState(pixKey ? "pix" : "cash_on_delivery");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [pedido, setPedido] = useState(null);

  async function finalizar(evento) {
    evento.preventDefault();
    setErro("");

    if (!nome.trim() || telefone.replace(/\D/g, "").length < 8 || !endereco.trim()) {
      setErro("Informe nome, telefone e endereço completos.");
      return;
    }

    setEnviando(true);

    try {
      const resultado = await criarPedido({
        cliente: { nome, telefone, endereco, observacoes },
        pagamento,
        itens: carrinho,
      });

      const dadosPedido = {
        ...resultado,
        telefone: telefone.replace(/\D/g, ""),
        pagamento,
      };

      localStorage.setItem(
        "selleta-last-order",
        JSON.stringify(dadosPedido)
      );
      setPedido(dadosPedido);
      onSuccess();
    } catch (error) {
      setErro(
        error.message.includes("Could not find the function")
          ? "Checkout em configuração. Finalize pelo WhatsApp por enquanto."
          : error.message
      );
    } finally {
      setEnviando(false);
    }
  }

  async function copiarPix() {
    await navigator.clipboard.writeText(pixKey);
  }

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="checkout-titulo"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wider text-[#8a5d2b]">
              Checkout Selleta
            </p>
            <h2 id="checkout-titulo" className="text-2xl font-bold">
              {pedido ? "Pedido realizado" : "Finalizar no site"}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar checkout"
            className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-xl"
          >
            ×
          </button>
        </div>

        {pedido ? (
          <div className="mt-6">
            <div className="rounded-2xl bg-green-50 p-5 text-green-800">
              <strong className="block text-lg">
                Pedido #{pedido.order_number} recebido!
              </strong>
              {pedido.pagamento === "pix"
                ? "O pedido aguarda a confirmação do pagamento Pix."
                : "O pagamento será realizado no momento da entrega."}
            </div>

            {pedido.pagamento === "pix" && pixKey && (
              <div className="mt-4 rounded-2xl border p-5">
                <p className="font-bold">Dados para pagamento Pix</p>
                <p className="mt-2 text-sm text-gray-500">
                  Favorecido: {pixReceiver}
                </p>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-3">
                  <code className="min-w-0 flex-1 break-all text-sm">{pixKey}</code>
                  <button
                    type="button"
                    onClick={copiarPix}
                    className="rounded-lg bg-[#8a5d2b] px-3 py-2 text-sm font-bold text-white"
                  >
                    Copiar
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Após pagar, aguarde a equipe confirmar o pagamento no sistema.
                </p>
              </div>
            )}

            <Link
              to={`/pedido?token=${pedido.public_token}`}
              className="mt-5 inline-flex w-full justify-center rounded-xl bg-[#2f2924] p-4 font-bold text-white"
            >
              Acompanhar pedido
            </Link>
          </div>
        ) : (
          <form onSubmit={finalizar} className="mt-6 space-y-5">
            <div className="rounded-2xl bg-[#fff7ed] p-4">
              <div className="flex justify-between font-bold">
                <span>{carrinho.length} produto(s)</span>
                <span>{formatarPreco(total)}</span>
              </div>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                {carrinho.map((item) => (
                  <div
                    key={`${item.id}-${item.tamanho}-${item.cor}`}
                    className="flex justify-between gap-3"
                  >
                    <span>
                      {item.quantidade}× {item.products} — {item.tamanho}/{item.cor}
                    </span>
                    <span>
                      {formatarPreco(
                        obterPrecoVenda(item) * item.quantidade
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome completo"
                maxLength={100}
                className="rounded-xl border p-3"
                required
              />
              <input
                type="tel"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Telefone"
                maxLength={20}
                className="rounded-xl border p-3"
                required
              />
            </div>

            <input
              value={endereco}
              onChange={(e) => setEndereco(e.target.value)}
              placeholder="Endereço completo para entrega"
              maxLength={300}
              className="w-full rounded-xl border p-3"
              required
            />

            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              placeholder="Observações do pedido"
              maxLength={500}
              rows={3}
              className="w-full rounded-xl border p-3"
            />

            <fieldset>
              <legend className="mb-3 font-bold">Forma de pagamento</legend>
              <div className="grid gap-3 sm:grid-cols-3">
                {pixKey && (
                  <label className="rounded-xl border p-4">
                    <input
                      type="radio"
                      name="pagamento"
                      value="pix"
                      checked={pagamento === "pix"}
                      onChange={(e) => setPagamento(e.target.value)}
                      className="mr-2 accent-[#8a5d2b]"
                    />
                    <strong>Pix</strong>
                    <span className="mt-1 block text-xs text-gray-500">
                      Confirmação manual
                    </span>
                  </label>
                )}
                <label className="rounded-xl border p-4">
                  <input
                    type="radio"
                    name="pagamento"
                    value="cash_on_delivery"
                    checked={pagamento === "cash_on_delivery"}
                    onChange={(e) => setPagamento(e.target.value)}
                    className="mr-2 accent-[#8a5d2b]"
                  />
                  <strong>Dinheiro</strong>
                  <span className="mt-1 block text-xs text-gray-500">
                    Na entrega
                  </span>
                </label>
                <label className="rounded-xl border p-4">
                  <input
                    type="radio"
                    name="pagamento"
                    value="card_on_delivery"
                    checked={pagamento === "card_on_delivery"}
                    onChange={(e) => setPagamento(e.target.value)}
                    className="mr-2 accent-[#8a5d2b]"
                  />
                  <strong>Cartão</strong>
                  <span className="mt-1 block text-xs text-gray-500">
                    Na entrega
                  </span>
                </label>
              </div>
            </fieldset>

            {erro && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {erro}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className="w-full rounded-xl bg-[#8a5d2b] p-4 font-bold text-white"
            >
              {enviando ? "Criando pedido..." : "Confirmar pedido"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
