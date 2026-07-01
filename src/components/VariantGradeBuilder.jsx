import { CORES_COMUNS, TAMANHOS_PADRAO } from "../lib/variants";

const inputClasse = "min-w-0 rounded-lg border border-gray-300 p-2 text-sm";

export default function VariantGradeBuilder({
  tamanhosSelecionados,
  coresSelecionadas,
  possuiEstampa,
  estampas,
  estoqueInicial,
  onAlternarTamanho,
  onAlternarCor,
  onPossuiEstampaChange,
  onAdicionarEstampa,
  onAlterarEstampa,
  onRemoverEstampa,
  onEstoqueInicialChange,
  onGerar,
}) {
  return (
    <div className="mt-4 space-y-4 rounded-xl border bg-white p-4">
      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Tamanhos</legend>
        <div className="flex flex-wrap gap-2">
          {TAMANHOS_PADRAO.map((tamanho) => (
            <button
              type="button"
              key={tamanho}
              onClick={() => onAlternarTamanho(tamanho)}
              aria-pressed={tamanhosSelecionados.includes(tamanho)}
              className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
                tamanhosSelecionados.includes(tamanho)
                  ? "border-[#8a5d2b] bg-[#8a5d2b] text-white"
                  : "bg-white"
              }`}
            >
              {tamanho}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">
          Cores ({coresSelecionadas.length} selecionada(s))
        </legend>
        <div className="grid max-h-48 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
          {CORES_COMUNS.map((cor) => {
            const selecionada = coresSelecionadas.includes(cor.nome);
            return (
              <button
                type="button"
                key={cor.nome}
                onClick={() => onAlternarCor(cor.nome)}
                aria-pressed={selecionada}
                className={`flex items-center gap-2 rounded-lg border p-2 text-left text-xs ${
                  selecionada
                    ? "border-[#8a5d2b] bg-[#fff7ed] font-bold"
                    : "bg-white"
                }`}
              >
                <span
                  className="h-5 w-5 shrink-0 rounded-full border"
                  style={{ backgroundColor: cor.hex }}
                />
                {cor.nome}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="flex items-center justify-between rounded-lg border p-3">
        <span>
          <strong className="block text-sm">Este produto possui estampa</strong>
          <span className="text-xs text-gray-500">
            A opção só aparecerá na loja quando estiver marcada.
          </span>
        </span>
        <input
          type="checkbox"
          checked={possuiEstampa}
          onChange={(evento) => onPossuiEstampaChange(evento.target.checked)}
          className="h-5 w-5 accent-[#8a5d2b]"
        />
      </label>

      {possuiEstampa && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <strong className="text-sm">Estampas deste produto</strong>
            <button
              type="button"
              onClick={onAdicionarEstampa}
              className="rounded-lg border px-3 py-2 text-xs font-semibold"
            >
              + Estampa
            </button>
          </div>
          {estampas.map((estampa) => (
            <div
              key={estampa.key}
              className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto]"
            >
              <input
                value={estampa.nome}
                onChange={(evento) =>
                  onAlterarEstampa(estampa.key, "nome", evento.target.value)
                }
                placeholder="Ex.: Floral azul"
                maxLength={80}
                className={inputClasse}
              />
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-xs">
                {estampa.imagemUrl && (
                  <img
                    src={estampa.imagemUrl}
                    alt=""
                    className="h-9 w-9 rounded object-cover"
                  />
                )}
                <span className="min-w-0 truncate">
                  {estampa.arquivo?.name || "Selecionar imagem"}
                </span>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(evento) =>
                    onAlterarEstampa(
                      estampa.key,
                      "arquivo",
                      evento.target.files?.[0] || null
                    )
                  }
                  className="sr-only"
                />
              </label>
              <button
                type="button"
                onClick={() => onRemoverEstampa(estampa.key)}
                className="text-xs font-semibold text-red-700"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <label>
          <span className="mb-1 block text-sm font-medium">
            Estoque inicial por combinação
          </span>
          <input
            type="number"
            min="0"
            step="1"
            value={estoqueInicial}
            onChange={(evento) => onEstoqueInicialChange(evento.target.value)}
            className={`${inputClasse} w-full`}
          />
        </label>
        <button
          type="button"
          onClick={onGerar}
          className="rounded-lg bg-[#8a5d2b] px-4 py-3 text-sm font-bold text-white"
        >
          Gerar combinações
        </button>
      </div>
    </div>
  );
}
