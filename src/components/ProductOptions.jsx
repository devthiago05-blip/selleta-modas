import { obterOpcoes } from "../lib/product";

const mapaCores = {
  preto: "#000000",
  branco: "#FFFFFF",
  vermelho: "#EF4444",
  azul: "#3B82F6",
  rosa: "#EC4899",
  verde: "#22C55E",
  amarelo: "#EAB308",
  bege: "#D6C6A5",
  marrom: "#92400E",
  cinza: "#6B7280",
  laranja: "#F97316",
  roxo: "#9333EA",
};

export default function ProductOptions({
  produto,
  tamanho,
  cor,
  quantidade,
  onTamanhoChange,
  onCorChange,
  onQuantidadeChange,
}) {
  const tamanhos = obterOpcoes(produto.tamanhos);
  const cores = obterOpcoes(produto.cores);
  const estoque = Math.max(0, Number(produto.estoque) || 0);

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
              const corNormalizada = opcao.toLowerCase();

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
                    backgroundColor: mapaCores[corNormalizada] || "#cccccc",
                  }}
                  title={opcao}
                />
              );
            })}
          </div>
          {cor && <p className="mt-2 text-sm text-gray-500">Cor: {cor}</p>}
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
          {estoque > 0 ? `Estoque disponível: ${estoque}` : "Produto esgotado"}
        </p>
      </div>
    </div>
  );
}
