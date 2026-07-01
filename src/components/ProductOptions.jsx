import {
  obterCoresProduto,
  obterEstampasProduto,
  obterTamanhosProduto,
  obterVariacaoSelecionada,
  obterVariacoes,
} from "../lib/product";
import { normalizarOpcao, obterHexCor, SEM_ESTAMPA } from "../lib/variants";

export default function ProductOptions({
  produto,
  tamanho,
  cor,
  estampa,
  quantidade,
  onTamanhoChange,
  onCorChange,
  onEstampaChange,
  onQuantidadeChange,
}) {
  const variacoes = obterVariacoes(produto);
  const tamanhos = obterTamanhosProduto(produto);
  const cores = variacoes.length
    ? [
        ...new Set(
          variacoes
            .filter((variacao) => !tamanho || variacao.size === tamanho)
            .map((variacao) => variacao.color)
        ),
      ]
    : obterCoresProduto(produto);
  const estampas = variacoes.length
    ? [
        ...new Set(
          variacoes
            .filter(
              (variacao) =>
                (!tamanho || variacao.size === tamanho) &&
                (!cor || variacao.color === cor)
            )
            .map((variacao) => variacao.print)
        ),
      ]
    : obterEstampasProduto(produto);
  const possuiEstampa = estampas.some(
    (opcao) => normalizarOpcao(opcao) !== normalizarOpcao(SEM_ESTAMPA)
  );
  const imagemPorEstampa = new Map(
    variacoes
      .filter((variacao) => variacao.print_image_url)
      .map((variacao) => [
        normalizarOpcao(variacao.print),
        variacao.print_image_url,
      ])
  );
  const variacaoSelecionada = obterVariacaoSelecionada(
    produto,
    tamanho,
    cor,
    estampa
  );
  const estoque = Math.max(
    0,
    Number(
      variacoes.length ? variacaoSelecionada?.stock : produto.estoque
    ) || 0
  );

  return (
    <div className="space-y-4">
      {tamanhos.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-semibold">Tamanho</legend>
          <div className="flex flex-wrap gap-2">
            {tamanhos.map((opcao) => (
              <button
                type="button"
                key={opcao}
                onClick={() => onTamanhoChange(opcao)}
                aria-pressed={tamanho === opcao}
                className={`rounded-lg border px-3 py-2 text-sm transition ${
                  tamanho === opcao
                    ? "border-[#8a5d2b] bg-[#8a5d2b] text-white"
                    : "hover:border-[#C58B39]"
                }`}
              >
                {opcao}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {cores.length > 0 && (
        <fieldset>
          <legend className="mb-2 font-semibold">Cor</legend>
          <div className="flex flex-wrap gap-2">
            {cores.map((opcao) => {
              return (
                <button
                  type="button"
                  key={opcao}
                  onClick={() => onCorChange(opcao)}
                  aria-label={`Selecionar cor ${opcao}`}
                  aria-pressed={cor === opcao}
                  className={`h-9 w-9 rounded-full border-2 shadow-sm transition ${
                    cor === opcao
                      ? "scale-110 border-[#8a5d2b] ring-2 ring-[#C58B39]/30"
                      : "border-gray-300"
                  }`}
                  style={{
                    backgroundColor: obterHexCor(opcao),
                  }}
                  title={opcao}
                />
              );
            })}
          </div>
          {cor && <p className="mt-2 text-sm text-gray-500">Cor: {cor}</p>}
        </fieldset>
      )}

      {possuiEstampa && (
        <fieldset>
          <legend className="mb-2 font-semibold">Estampa</legend>
          <div className="flex flex-wrap gap-2">
            {estampas.map((opcao) => {
              const imagem = imagemPorEstampa.get(normalizarOpcao(opcao));
              return (
                <button
                  type="button"
                  key={opcao}
                  onClick={() => onEstampaChange(opcao)}
                  aria-pressed={estampa === opcao}
                  className={`overflow-hidden rounded-xl border text-left text-sm transition ${
                    estampa === opcao
                      ? "border-[#8a5d2b] ring-2 ring-[#C58B39]/30"
                      : "hover:border-[#C58B39]"
                  }`}
                >
                  {imagem && (
                    <img
                      src={imagem}
                      alt={`Estampa ${opcao}`}
                      loading="lazy"
                      className="h-16 w-20 object-cover"
                    />
                  )}
                  <span className="block px-3 py-2">{opcao}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div>
        <p className="mb-2 font-semibold">Quantidade</p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onQuantidadeChange(Math.max(1, quantidade - 1))}
            disabled={quantidade <= 1 || estoque === 0}
            aria-label={`Diminuir quantidade de ${produto.products}`}
            className="h-9 w-9 rounded-lg border font-bold"
          >
            −
          </button>
          <span className="min-w-6 text-center font-bold">{quantidade}</span>
          <button
            type="button"
            onClick={() => onQuantidadeChange(Math.min(estoque, quantidade + 1))}
            disabled={quantidade >= estoque || estoque === 0}
            aria-label={`Aumentar quantidade de ${produto.products}`}
            className="h-9 w-9 rounded-lg border font-bold"
          >
            +
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-500">
          {variacoes.length > 0 && !variacaoSelecionada
            ? "Selecione a combinação para consultar o estoque"
            : estoque > 0
              ? `Estoque disponível: ${estoque}`
              : "Produto esgotado"}
        </p>
      </div>
    </div>
  );
}
