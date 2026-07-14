import { useEffect, useMemo, useState } from "react";
import ProductOptions from "./ProductOptions";
import {
  obterImagensProduto,
  obterPrecoVenda,
  temPrecoPromocional,
} from "../lib/product";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function ProductModal({
  produto,
  tamanho,
  cor,
  estampa,
  quantidade,
  onTamanhoChange,
  onCorChange,
  onEstampaChange,
  onQuantidadeChange,
  onAdicionar,
  adicionado,
  onClose,
}) {
  const imagens = useMemo(() => obterImagensProduto(produto), [produto]);
  const [imagemAtiva, setImagemAtiva] = useState(imagens[0] || "");

  useEffect(() => {
    function fecharComEscape(evento) {
      if (evento.key === "Escape") onClose();
    }

    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", fecharComEscape);

    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-produto"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) onClose();
      }}
    >
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex justify-end bg-white/95 p-3 backdrop-blur">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar detalhes do produto"
            className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-2xl"
          >
            ×
          </button>
        </div>

        <div className="grid gap-6 px-5 pb-7 md:grid-cols-2 md:px-8 md:pb-10">
          <div>
            {imagemAtiva ? (
              <img
                src={imagemAtiva}
                alt={produto.products}
                className="aspect-[4/5] w-full rounded-2xl border bg-[#f8f6f3] object-contain"
              />
            ) : (
              <div className="grid aspect-[4/5] place-items-center rounded-2xl bg-gray-100 text-gray-500">
                Imagem indisponível
              </div>
            )}

            {imagens.length > 1 && (
              <div className="mt-3 grid grid-cols-4 gap-2">
                {imagens.map((imagem, index) => (
                  <button
                    key={imagem}
                    type="button"
                    onClick={() => setImagemAtiva(imagem)}
                    aria-label={`Ver foto ${index + 1} de ${produto.products}`}
                    className={`rounded-xl border bg-[#f8f6f3] p-1 ${
                      imagem === imagemAtiva
                        ? "border-[#8a5d2b] ring-2 ring-[#8a5d2b]/20"
                        : "border-gray-200"
                    }`}
                  >
                    <img
                      src={imagem}
                      alt=""
                      className="aspect-[4/5] w-full rounded-lg object-contain"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#8a5d2b]">
              {produto.categoria || "Moda feminina"}
            </p>
            <h2 id="titulo-produto" className="mt-1 text-3xl font-bold">
              {produto.products}
            </h2>
            <div className="mt-3">
              {temPrecoPromocional(produto) && (
                <p className="text-sm text-gray-400 line-through">
                  {formatarPreco(produto.preco)}
                </p>
              )}
              <p className="text-2xl font-bold text-[#8a5d2b]">
                {formatarPreco(obterPrecoVenda(produto))}
              </p>
            </div>
            <p className="mt-4 leading-relaxed text-gray-600">
              {produto.descricao || "Peça selecionada pela Selleta Modas."}
            </p>

            <div className="my-6">
              <ProductOptions
                produto={produto}
                tamanho={tamanho}
                cor={cor}
                estampa={estampa}
                quantidade={quantidade}
                onTamanhoChange={onTamanhoChange}
                onCorChange={onCorChange}
                onEstampaChange={onEstampaChange}
                onQuantidadeChange={onQuantidadeChange}
              />
            </div>

            <button
              type="button"
              onClick={onAdicionar}
              disabled={produto.estoque <= 0}
              className={`w-full rounded-xl p-4 font-bold text-white transition ${
                adicionado
                  ? "scale-[1.02] bg-emerald-600"
                  : "bg-[#8a5d2b] hover:bg-[#70491f]"
              }`}
            >
              {produto.estoque > 0
                ? adicionado
                  ? "✓ Adicionado ao carrinho"
                  : "Adicionar ao carrinho"
                : "Produto esgotado"}
            </button>

            <div className="mt-6 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
              <div className="rounded-xl bg-[#fff7ed] p-4">
                <strong className="block text-gray-900">Entrega</strong>
                Prazo e valor confirmados no atendimento.
              </div>
              <div className="rounded-xl bg-[#fff7ed] p-4">
                <strong className="block text-gray-900">Trocas</strong>
                Consulte condições e disponibilidade pelo WhatsApp.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
