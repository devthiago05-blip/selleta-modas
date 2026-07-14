import logoSelleta from "../assets/logo-selleta.png";
import {
  obterCoresProduto,
  obterImagemPrincipal,
  obterPrecoVenda,
  obterTamanhosProduto,
  temPrecoPromocional,
} from "../lib/product";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function ProductCard({ produto, onOpen }) {
  const tamanhos = obterTamanhosProduto(produto).slice(0, 4);
  const quantidadeCores = obterCoresProduto(produto).length;
  const emEstoque = Number(produto.estoque || 0) > 0;
  const imagemPrincipal = obterImagemPrincipal(produto);

  return (
    <article className="group flex min-w-0 overflow-hidden rounded-2xl border border-[#8a5d2b]/10 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div className="flex w-full flex-col">
        <button
          type="button"
          onClick={onOpen}
          className="relative block overflow-hidden text-left"
          aria-label={`Ver detalhes de ${produto.products}`}
        >
          {imagemPrincipal ? (
            <img
              src={imagemPrincipal}
              alt={produto.products}
              loading="lazy"
              decoding="async"
              className="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="grid aspect-[4/5] place-items-center bg-[#fff7ed]">
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
        </button>

        <div className="flex flex-1 flex-col p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#8a5d2b]">
            {produto.categoria || "Moda feminina"}
          </p>
          <h3 className="mt-1 text-lg font-bold">{produto.products}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-500">
            {produto.descricao || "Peça selecionada pela Selleta Modas."}
          </p>

          {(tamanhos.length > 0 || quantidadeCores > 0) && (
            <div className="mt-3 flex min-h-7 flex-wrap items-center gap-1.5 text-xs text-gray-500">
              {tamanhos.map((tamanho) => (
                <span
                  key={tamanho}
                  className="grid min-w-7 place-items-center rounded-md border border-gray-200 bg-gray-50 px-1.5 py-1 font-semibold uppercase text-gray-700"
                >
                  {tamanho}
                </span>
              ))}
              {quantidadeCores > 0 && (
                <span className="ml-1">
                  {quantidadeCores} {quantidadeCores === 1 ? "cor" : "cores"}
                </span>
              )}
            </div>
          )}

          <div className="mt-4">
            {temPrecoPromocional(produto) && (
              <p className="text-sm text-gray-400 line-through">
                {formatarPreco(produto.preco)}
              </p>
            )}
            <p className="text-xl font-bold text-[#8a5d2b]">
              {formatarPreco(obterPrecoVenda(produto))}
            </p>
          </div>

          <button
            type="button"
            onClick={onOpen}
            className="mt-5 w-full rounded-xl bg-[#8a5d2b] p-3 font-semibold text-white transition hover:bg-[#70491f]"
          >
            {emEstoque ? "Escolher opções" : "Consultar produto"}
          </button>
        </div>
      </div>
    </article>
  );
}
