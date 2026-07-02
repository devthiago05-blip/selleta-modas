const campoClasse =
  "min-w-0 w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none transition focus:border-[#C58B39] focus:ring-2 focus:ring-[#C58B39]/15";

const capitalizar = (valor) =>
  String(valor || "").replace(/^./u, (letra) => letra.toLocaleUpperCase("pt-BR"));

export default function CatalogFilters({
  busca,
  categoriaSelecionada,
  tamanhoFiltro,
  corFiltro,
  precoMaximo,
  categorias,
  tamanhos,
  cores,
  filtrosAtivos,
  totalEncontrado,
  onBuscaChange,
  onCategoriaChange,
  onTamanhoChange,
  onCorChange,
  onPrecoChange,
  onLimpar,
}) {
  return (
    <>
      <div className="mb-6 grid min-w-0 gap-5 lg:grid-cols-[minmax(220px,0.7fr)_minmax(0,2fr)] lg:items-end">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#8a5d2b] sm:text-sm">
            Catálogo
          </p>
          <h2 id="titulo-catalogo" className="mt-1 text-2xl font-bold sm:text-3xl">
            Encontre seu próximo look
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            Filtre por categoria, tamanho, cor ou faixa de preço.
          </p>
        </div>

        <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <input
            type="search"
            value={busca}
            onChange={(evento) => onBuscaChange(evento.target.value)}
            placeholder="Buscar produto"
            aria-label="Buscar produto"
            className={campoClasse}
          />
          <select
            value={categoriaSelecionada}
            onChange={(evento) => onCategoriaChange(evento.target.value)}
            aria-label="Filtrar por categoria"
            className={campoClasse}
          >
            <option value="">Todas as categorias</option>
            {categorias.map((categoria) => (
              <option key={categoria} value={categoria}>{categoria}</option>
            ))}
          </select>
          <select
            value={tamanhoFiltro}
            onChange={(evento) => onTamanhoChange(evento.target.value)}
            aria-label="Filtrar por tamanho"
            className={campoClasse}
          >
            <option value="">Todos os tamanhos</option>
            {tamanhos.map((tamanho) => (
              <option key={tamanho} value={tamanho}>{tamanho}</option>
            ))}
          </select>
          <select
            value={corFiltro}
            onChange={(evento) => onCorChange(evento.target.value)}
            aria-label="Filtrar por cor"
            className={campoClasse}
          >
            <option value="">Todas as cores</option>
            {cores.map((cor) => (
              <option key={cor} value={cor}>{capitalizar(cor)}</option>
            ))}
          </select>
          <input
            type="number"
            min="0"
            step="10"
            value={precoMaximo}
            onChange={(evento) => onPrecoChange(evento.target.value)}
            placeholder="Preço máximo"
            aria-label="Filtrar por preço máximo"
            className={campoClasse}
          />
        </div>
      </div>

      {categorias.length > 0 && (
        <div className="mb-6 flex max-w-full gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => onCategoriaChange("")}
            className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
              !categoriaSelecionada
                ? "border-[#8a5d2b] bg-[#8a5d2b] text-white"
                : "bg-white text-gray-600"
            }`}
          >
            Ver tudo
          </button>
          {categorias.map((categoria) => (
            <button
              type="button"
              key={categoria}
              onClick={() => onCategoriaChange(categoria)}
              className={`whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition ${
                categoriaSelecionada === categoria
                  ? "border-[#8a5d2b] bg-[#8a5d2b] text-white"
                  : "bg-white text-gray-600"
              }`}
            >
              {categoria}
            </button>
          ))}
        </div>
      )}

      {filtrosAtivos && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[#fff2df] px-4 py-3 text-sm">
          <span>{totalEncontrado} produto(s) encontrado(s)</span>
          <button
            type="button"
            onClick={onLimpar}
            className="font-semibold text-[#8a5d2b] hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}
    </>
  );
}
