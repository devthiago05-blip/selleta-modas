import { Link } from "react-router-dom";
import logoSelleta from "../assets/logo-selleta.png";
import {
  obterImagemPrincipal,
  obterOpcoesDisponiveisProduto,
  obterPrecoVenda,
  obterUrlProduto,
  temPrecoPromocional,
} from "../lib/product";
import { normalizarOpcao, obterHexCor, SEM_ESTAMPA } from "../lib/variants";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function ProductCard({
  produto,
  tamanho,
  cor,
  estampa,
  adicionado,
  onTamanhoChange,
  onCorChange,
  onEstampaChange,
  onAdicionar,
  onComprarAgora,
  onOpen,
}) {
  const opcoes = obterOpcoesDisponiveisProduto(produto, {
    tamanho,
    cor,
    estampa,
  });
  const emEstoque = opcoes.estoque > 0;
  const imagemPrincipal = obterImagemPrincipal(produto);
  const possuiEstampa = opcoes.estampas.some(
    (opcao) => normalizarOpcao(opcao) !== normalizarOpcao(SEM_ESTAMPA)
  );

  return (
    <article className="group flex h-full min-w-0 overflow-hidden rounded-2xl border border-[#8a5d2b]/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex h-full w-full flex-col">
        <Link
          to={obterUrlProduto(produto)}
          className="relative block overflow-hidden text-left"
          aria-label={`Abrir página de ${produto.products}`}
        >
          {imagemPrincipal ? (
            <img
              src={imagemPrincipal}
              alt={produto.products}
              loading="lazy"
              decoding="async"
              className="h-80 w-full bg-[#f8f1e9] object-contain transition duration-500 group-hover:scale-[1.03] sm:h-[22rem] lg:h-[21rem] xl:h-[20rem]"
            />
          ) : (
            <div className="grid h-80 place-items-center bg-[#fff7ed] sm:h-[22rem] lg:h-[21rem] xl:h-[20rem]">
              <img
                src={logoSelleta}
                alt=""
                className="w-32 opacity-50"
                aria-hidden="true"
              />
            </div>
          )}

          {temPrecoPromocional(produto) && (
            <span className="absolute left-3 top-3 rounded-full bg-red-600 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
              Oferta
            </span>
          )}
          <span
            className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold ${
              emEstoque
                ? "bg-white/90 text-emerald-700"
                : "bg-gray-900/80 text-white"
            }`}
          >
            {emEstoque ? "Em estoque" : "Esgotado"}
          </span>
        </Link>

        <div className="flex flex-1 flex-col p-4">
          <Link to={obterUrlProduto(produto)} className="group/title">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5d2b]">
              {produto.categoria || "Moda feminina"}
            </p>
            <h3 className="mt-1 line-clamp-2 min-h-[3.5rem] text-lg font-bold leading-snug group-hover/title:text-[#8a5d2b]">
              {produto.products}
            </h3>
          </Link>
          <p className="mt-2 line-clamp-2 min-h-[2.75rem] text-sm leading-relaxed text-gray-500">
            {produto.descricao || "Peça selecionada pela Selleta Modas."}
          </p>

          <div className="mt-4 min-h-[3.75rem]">
            {temPrecoPromocional(produto) && (
              <p className="text-sm text-gray-400 line-through">
                {formatarPreco(produto.preco)}
              </p>
            )}
            <p className="text-xl font-bold text-[#8a5d2b]">
              {formatarPreco(obterPrecoVenda(produto))}
            </p>
          </div>

          <div className="mt-4 min-h-[9.75rem] space-y-3">
            {opcoes.tamanhos.length > 0 && (
              <fieldset>
                <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Tamanho
                </legend>
                <div className="flex flex-wrap gap-1.5">
                  {opcoes.tamanhos.map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => onTamanhoChange(opcao)}
                      aria-pressed={opcoes.tamanho === opcao}
                      className={`grid min-w-9 place-items-center rounded-lg border px-2.5 py-2 text-sm font-bold uppercase transition ${
                        opcoes.tamanho === opcao
                          ? "border-[#8a5d2b] bg-[#8a5d2b] text-white"
                          : "border-gray-200 bg-white text-gray-700 hover:border-[#C58B39]"
                      }`}
                    >
                      {opcao}
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {opcoes.cores.length > 0 && (
              <fieldset>
                <legend className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Cor
                </legend>
                <div className="flex flex-wrap items-center gap-2">
                  {opcoes.cores.map((opcao) => (
                    <button
                      key={opcao}
                      type="button"
                      onClick={() => onCorChange(opcao)}
                      aria-label={`Selecionar cor ${opcao}`}
                      aria-pressed={opcoes.cor === opcao}
                      title={opcao}
                      className={`h-8 w-8 rounded-full border-2 shadow-sm transition ${
                        opcoes.cor === opcao
                          ? "scale-110 border-[#8a5d2b] ring-2 ring-[#C58B39]/30"
                          : "border-gray-300"
                      }`}
                      style={{ backgroundColor: obterHexCor(opcao) }}
                    />
                  ))}
                  {opcoes.cor && (
                    <span className="text-xs text-gray-500">{opcoes.cor}</span>
                  )}
                </div>
              </fieldset>
            )}

            {possuiEstampa && opcoes.estampas.length > 1 && (
              <label className="block">
                <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Estampa
                </span>
                <select
                  value={opcoes.estampa}
                  onChange={(evento) => onEstampaChange(evento.target.value)}
                  className="w-full rounded-lg border border-gray-200 bg-white p-2 text-sm outline-none focus:border-[#C58B39]"
                >
                  {opcoes.estampas.map((opcao) => (
                    <option key={opcao}>{opcao}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          {emEstoque ? (
            <div className="mt-auto grid grid-cols-2 gap-2 pt-5">
              <button
                type="button"
                onClick={onAdicionar}
                className={`rounded-xl border p-3 text-sm font-semibold transition ${
                  adicionado
                    ? "border-emerald-600 bg-emerald-50 text-emerald-700"
                    : "border-[#8a5d2b]/25 text-[#8a5d2b] hover:bg-[#fff7ed]"
                }`}
              >
                {adicionado ? "✓ Adicionado" : "Adicionar"}
              </button>

              <button
                type="button"
                onClick={onComprarAgora}
                className="rounded-xl bg-[#8a5d2b] p-3 text-sm font-semibold text-white transition hover:bg-[#70491f]"
              >
                Comprar agora
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpen}
              className="mt-auto w-full rounded-xl bg-[#8a5d2b] p-3 font-semibold text-white transition hover:bg-[#70491f]"
            >
              Consultar produto
            </button>
          )}

          <Link
            to={obterUrlProduto(produto)}
            className="mt-2 text-sm font-semibold text-[#8a5d2b] hover:underline"
          >
            Ver detalhes
          </Link>
        </div>
      </div>
    </article>
  );
}
