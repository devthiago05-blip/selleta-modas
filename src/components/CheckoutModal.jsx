import { useState } from "react";
import { Link } from "react-router-dom";
import { criarPedido } from "../lib/orders";
import { obterPrecoVenda } from "../lib/product";
import { supabase } from "../lib/supabase";

const pixKey = import.meta.env.VITE_PIX_KEY || "";
const pixReceiver = import.meta.env.VITE_PIX_RECEIVER || "Selleta Modas";
const whatsappNumero = String(
  import.meta.env.VITE_WHATSAPP_NUMBER || "5585992903028"
).replace(/\D/g, "");
const chaveAcompanhamento = "selleta-last-order";

const etapasPedido = [
  "Pedido recebido",
  "Pagamento analisado",
  "Pedido confirmado",
  "Preparação e entrega",
];

function salvarAcompanhamento(pedido) {
  try {
    sessionStorage.setItem(
      chaveAcompanhamento,
      JSON.stringify({
        public_token: pedido.public_token,
        telefone: pedido.telefone,
      })
    );
    localStorage.removeItem(chaveAcompanhamento);
  } catch {
    // O pedido continua disponível na tela mesmo sem armazenamento local.
  }
}

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
  const [aceitouPoliticas, setAceitouPoliticas] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [pedido, setPedido] = useState(null);
  const [pixCopiado, setPixCopiado] = useState(false);

  async function finalizar(evento) {
    evento.preventDefault();
    setErro("");

    if (!nome.trim() || telefone.replace(/\D/g, "").length < 8 || !endereco.trim()) {
      setErro("Informe nome, telefone e endereço completos.");
      return;
    }

    if (!aceitouPoliticas) {
      setErro("Confirme que leu as políticas de compra.");
      return;
    }

    setEnviando(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const resultado = await criarPedido({
        cliente: { nome, telefone, endereco, observacoes },
        pagamento,
        itens: carrinho,
        accessToken: session?.access_token,
      });

      const dadosPedido = {
        ...resultado,
        telefone: telefone.replace(/\D/g, ""),
        pagamento,
      };

      salvarAcompanhamento(dadosPedido);
      setPedido(dadosPedido);
      onSuccess();
    } catch (error) {
      setErro(
        error?.code === "PGRST202" ||
          error?.message?.includes("Could not find the function")
          ? "Checkout em configuração. Finalize pelo WhatsApp por enquanto."
          : "Não foi possível criar o pedido. Tente novamente ou finalize pelo WhatsApp."
      );
    } finally {
      setEnviando(false);
    }
  }

  async function copiarPix() {
    await navigator.clipboard.writeText(pixKey);
    setPixCopiado(true);
  }

  const mensagemWhatsAppPedido = pedido
    ? `Olá! Acabei de fazer o pedido #${pedido.order_number} pelo site da Selleta Modas.`
    : "";

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
          <div className="mt-6 space-y-4">
            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-[#fff7ed] p-5 text-emerald-900">
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-700">
                Pedido criado
              </p>
              <strong className="mt-1 block text-2xl">
                Pedido #{pedido.order_number} recebido!
              </strong>
              <p className="mt-2 text-sm text-emerald-800/80">
                {pedido.pagamento === "pix"
                  ? "Seu pedido ficou com pagamento pendente até a equipe confirmar o Pix."
                  : "Seu pedido foi recebido e o pagamento será tratado na entrega."}
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-4">
              {etapasPedido.map((etapa, index) => (
                <div
                  key={etapa}
                  className={`rounded-2xl border p-3 text-sm ${
                    index === 0
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-gray-200 bg-gray-50 text-gray-500"
                  }`}
                >
                  <span className="mb-2 grid h-7 w-7 place-items-center rounded-full bg-white text-xs font-bold">
                    {index + 1}
                  </span>
                  {etapa}
                </div>
              ))}
            </div>

            {pedido.pagamento === "pix" && pixKey && (
              <div className="rounded-2xl border border-[#8a5d2b]/15 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold">Dados para pagamento Pix</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Favorecido: {pixReceiver}
                    </p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-800">
                    Pendente
                  </span>
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-xl bg-gray-50 p-3">
                  <code className="min-w-0 flex-1 break-all text-sm">{pixKey}</code>
                  <button
                    type="button"
                    onClick={copiarPix}
                    className="rounded-lg bg-[#8a5d2b] px-3 py-2 text-sm font-bold text-white"
                  >
                    {pixCopiado ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="mt-3 text-sm text-gray-500">
                  Depois do Pix, envie o comprovante pelo WhatsApp ou aguarde a
                  conferência da equipe. O status mudará para pagamento
                  confirmado quando for aprovado.
                </p>
              </div>
            )}

            <div className="grid gap-2 sm:grid-cols-2">
              <Link
                to={`/pedido?token=${pedido.public_token}`}
                className="inline-flex justify-center rounded-xl bg-[#2f2924] p-4 font-bold text-white"
              >
                Acompanhar pedido
              </Link>
              <a
                href={`https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
                  mensagemWhatsAppPedido
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex justify-center rounded-xl bg-green-600 p-4 font-bold text-white"
              >
                Falar no WhatsApp
              </a>
            </div>

            <Link
              to="/cliente"
              className="block rounded-2xl bg-[#fff7ed] p-4 text-center text-sm font-semibold text-[#8a5d2b]"
            >
              Entrar ou criar conta para ver seus pedidos em um só lugar
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
                    key={`${item.id}-${item.tamanho}-${item.cor}-${item.estampa || ""}`}
                    className="flex justify-between gap-3"
                  >
                    <span>
                      {item.quantidade}× {item.products} — {item.tamanho}/
                      {item.cor}/{item.estampa || "Sem estampa"}
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

            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
              O subtotal não inclui frete. Prazo e valor da entrega serão
              confirmados pela equipe antes do envio.
            </p>

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

            <label className="flex items-start gap-3 rounded-xl border p-4 text-sm">
              <input
                type="checkbox"
                checked={aceitouPoliticas}
                onChange={(e) => setAceitouPoliticas(e.target.checked)}
                className="mt-1 h-4 w-4 accent-[#8a5d2b]"
                required
              />
              <span>
                Li e aceito as{" "}
                <Link
                  to="/politicas"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[#8a5d2b] underline"
                >
                  políticas de compra, entrega, troca e privacidade
                </Link>
                .
              </span>
            </label>

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
