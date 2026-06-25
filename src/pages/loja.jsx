
import logoSelleta from "../assets/logo-selleta.png";
import { useCallback, useEffect, useState } from "react";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import SiteHeader from "../components/SiteHeader";
import {
  obterOpcoes,
  obterPrecoVenda,
} from "../lib/product";
import { supabase } from "../lib/supabase";

const CHAVE_CARRINHO = "selleta-modas-carrinho";
const whatsappNumero = String(
  import.meta.env.VITE_WHATSAPP_NUMBER || "5585992903028"
).replace(/\D/g, "");

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function Loja() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState(() => {
    try {
      const carrinhoSalvo = localStorage.getItem(CHAVE_CARRINHO);
      return carrinhoSalvo ? JSON.parse(carrinhoSalvo) : [];
    } catch {
      return [];
    }
  });
  const [carrinhoAberto, setCarrinhoAberto] =
  useState(false);
  const [produtoAberto, setProdutoAberto] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState({});
  const [corSelecionada, setCorSelecionada] = useState({});
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState({});
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [enderecoCliente, setEnderecoCliente] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");
  const [busca, setBusca] = useState("");
  const [categoriaSelecionada, setCategoriaSelecionada] = useState("");
  const [tamanhoFiltro, setTamanhoFiltro] = useState("");
  const [corFiltro, setCorFiltro] = useState("");
  const [precoMaximo, setPrecoMaximo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erroProdutos, setErroProdutos] = useState("");
  const [feedback, setFeedback] = useState("");
  const fecharProduto = useCallback(() => setProdutoAberto(null), []);

  function adicionarAoCarrinho(produto) {
  const tamanhosProduto = obterOpcoes(produto.tamanhos);
  const coresProduto = obterOpcoes(produto.cores);

  if (tamanhosProduto.length > 0 && !tamanhoSelecionado[produto.id]) {
    setFeedback("Selecione um tamanho antes de adicionar.");
    return;
  }

  if (coresProduto.length > 0 && !corSelecionada[produto.id]) {
    setFeedback("Selecione uma cor antes de adicionar.");
    return;
  }

  if (
  (quantidadeSelecionada[produto.id] || 1) >
  produto.estoque
) {
  setFeedback("Quantidade maior que o estoque disponível.");
  return;
}

  const itemCarrinho = {
    ...produto,
    tamanho: tamanhoSelecionado[produto.id] || "Único",
    cor: corSelecionada[produto.id] || "Padrão",
    quantidade:
      quantidadeSelecionada[produto.id] || 1,
  };

  const itemExistente = carrinho.find(
    (item) =>
      item.id === itemCarrinho.id &&
      item.tamanho === itemCarrinho.tamanho &&
      item.cor === itemCarrinho.cor
  );

  if (
    itemExistente &&
    itemExistente.quantidade + itemCarrinho.quantidade > produto.estoque
  ) {
    setFeedback("A quantidade total ultrapassa o estoque disponível.");
    return;
  }

  setCarrinho((itens) => {

  const itemAtual = itens.find(
    (item) =>
      item.id === itemCarrinho.id &&
      item.tamanho === itemCarrinho.tamanho &&
      item.cor === itemCarrinho.cor
  );

  if (itemAtual) {
    return itens.map((item) => {

      if (
        item.id === itemCarrinho.id &&
        item.tamanho === itemCarrinho.tamanho &&
        item.cor === itemCarrinho.cor
      ) {

        const novaQuantidade =
          item.quantidade +
          itemCarrinho.quantidade;

        return {
          ...item,
          quantidade: novaQuantidade,
        };
      }

      return item;
    });
  }

  return [...itens, itemCarrinho];
});
  setFeedback("Produto adicionado ao carrinho.");
}

function removerDoCarrinho(indexRemover) {
  setCarrinho((itens) =>
    itens.filter((_, index) => index !== indexRemover)
  );
}
function alterarQuantidadeCarrinho(index, novaQuantidade) {

  if (novaQuantidade < 1) return;

  setCarrinho((itens) =>
    itens.map((item, i) =>
      i === index
        ? {
            ...item,
            quantidade: Math.min(novaQuantidade, item.estoque),
          }
        : item
    )
  );
}
function finalizarPedido() {
  if (!nomeCliente.trim()) {
  setFeedback("Informe seu nome.");
  return;
}

if (!telefoneCliente.trim()) {
  setFeedback("Informe seu telefone.");
  return;
}
  if (carrinho.length === 0) {
    setFeedback("Seu carrinho está vazio.");
    return;
  }

  let mensagem = "Olá! Gostaria de fazer o seguinte pedido:\n\n";

  carrinho.forEach((item) => {
    mensagem +=
      `• ${item.products}\n` +
      `Tam: ${item.tamanho}\n` +
      `Cor: ${item.cor}\n` +
      `Qtd: ${item.quantidade}\n` +
      `Valor: ${formatarPreco(obterPrecoVenda(item) * item.quantidade)}\n\n`;
  });

  mensagem +=
  `Total: ${formatarPreco(total)}\n\n` +
  `Nome: ${nomeCliente.trim()}\n` +
  `Telefone: ${telefoneCliente.trim()}\n` +
  `Endereço: ${enderecoCliente.trim() || "A combinar"}\n` +
  `Observações: ${observacoesCliente}`;

  window.open(
    `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(mensagem)}`,
    "_blank",
    "noopener,noreferrer"
  );
}

  useEffect(() => {
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(carrinho));
  }, [carrinho]);

  useEffect(() => {
    const produtosAtivos = produtos.filter((produto) => produto.ativo !== false);

    if (produtosAtivos.length === 0) return undefined;

    const script = document.createElement("script");
    script.id = "selleta-product-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: produtosAtivos.map((produto, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "Product",
          name: produto.products,
          description: produto.descricao || undefined,
          image: produto.imagem || undefined,
          category: produto.categoria || undefined,
          offers: {
            "@type": "Offer",
            url: window.location.origin,
            priceCurrency: "BRL",
            price: obterPrecoVenda(produto).toFixed(2),
            availability:
              Number(produto.estoque) > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        },
      })),
    });

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [produtos]);

  useEffect(() => {
    let ativo = true;

    async function carregarProdutos() {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("products");

      if (!ativo) return;

      if (error) {
        setErroProdutos("Não foi possível carregar o catálogo agora.");
        setCarregando(false);
        return;
      }

      setProdutos(data || []);
      setCarregando(false);
    }

    carregarProdutos();

    return () => {
      ativo = false;
    };
  }, []);
  const quantidadeCarrinho = carrinho.reduce(
  (soma, item) =>
    soma + item.quantidade,
  0
);
  const total = carrinho.reduce(
  (soma, item) =>
    soma + obterPrecoVenda(item) * item.quantidade,
  0
);
  const categorias = [
    ...new Set(produtos.map((produto) => produto.categoria).filter(Boolean)),
  ];
  const tamanhosDisponiveis = [
    ...new Set(produtos.flatMap((produto) => obterOpcoes(produto.tamanhos))),
  ];
  const coresDisponiveis = [
    ...new Set(produtos.flatMap((produto) => obterOpcoes(produto.cores))),
  ];
  const produtosFiltrados = produtos.filter((produto) => {
    const produtoAtivo = produto.ativo !== false;
    const correspondeBusca = produto.products
      ?.toLowerCase()
      .includes(busca.trim().toLowerCase());
    const correspondeCategoria =
      !categoriaSelecionada || produto.categoria === categoriaSelecionada;
    const correspondeTamanho =
      !tamanhoFiltro || obterOpcoes(produto.tamanhos).includes(tamanhoFiltro);
    const correspondeCor =
      !corFiltro || obterOpcoes(produto.cores).includes(corFiltro);
    const correspondePreco =
      !precoMaximo || obterPrecoVenda(produto) <= Number(precoMaximo);

    return (
      produtoAtivo &&
      correspondeBusca &&
      correspondeCategoria &&
      correspondeTamanho &&
      correspondeCor &&
      correspondePreco
    );
  });
  const filtrosAtivos =
    busca ||
    categoriaSelecionada ||
    tamanhoFiltro ||
    corFiltro ||
    precoMaximo;

  function limparFiltros() {
    setBusca("");
    setCategoriaSelecionada("");
    setTamanhoFiltro("");
    setCorFiltro("");
    setPrecoMaximo("");
  }

  return (
    <div className="min-h-screen">
      <SiteHeader
        quantidadeCarrinho={quantidadeCarrinho}
        onOpenCart={() => setCarrinhoAberto(true)}
      />

    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
      {feedback && (
        <div
          role="status"
          className="fixed left-1/2 top-4 z-[60] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between gap-3 rounded-xl bg-[#2f2924] px-4 py-3 text-sm text-white shadow-xl"
        >
          <span>{feedback}</span>
          <button
            onClick={() => setFeedback("")}
            className="text-lg leading-none"
            aria-label="Fechar mensagem"
          >
            ×
          </button>
        </div>
      )}

      {produtoAberto && (
        <ProductModal
          produto={produtoAberto}
          tamanho={tamanhoSelecionado[produtoAberto.id] || ""}
          cor={corSelecionada[produtoAberto.id] || ""}
          quantidade={quantidadeSelecionada[produtoAberto.id] || 1}
          onTamanhoChange={(tamanho) =>
            setTamanhoSelecionado((selecoes) => ({
              ...selecoes,
              [produtoAberto.id]: tamanho,
            }))
          }
          onCorChange={(cor) =>
            setCorSelecionada((selecoes) => ({
              ...selecoes,
              [produtoAberto.id]: cor,
            }))
          }
          onQuantidadeChange={(quantidade) =>
            setQuantidadeSelecionada((selecoes) => ({
              ...selecoes,
              [produtoAberto.id]: quantidade,
            }))
          }
          onAdicionar={() => adicionarAoCarrinho(produtoAberto)}
          onClose={fecharProduto}
        />
      )}

      <div className="mb-10"> {carrinhoAberto && ( 
        <>
  <div
    className="
      fixed
      inset-0
      bg-black/50
      z-40
    "
    onClick={() => setCarrinhoAberto(false)}
  />
        <div
  role="dialog"
  aria-modal="true"
  aria-labelledby="titulo-carrinho"
  className="
    fixed
    top-0
    right-0
    h-full
    w-full
    max-w-md
    bg-white
    shadow-2xl
    p-4
    overflow-y-auto
    z-50
  "
>
  <div className="flex justify-between items-center mb-4">

  <h2 id="titulo-carrinho" className="text-xl font-bold">
    Resumo do Pedido
  </h2>

  <button
    onClick={() => setCarrinhoAberto(false)}
    aria-label="Fechar carrinho"
    className="
      text-2xl
      font-bold
      text-gray-500
      hover:text-black
    "
  >
    ×
  </button>

</div>

  {carrinho.length === 0 && (
    <div className="rounded-xl bg-gray-50 p-6 text-center text-gray-500">
      Seu carrinho está vazio.
    </div>
  )}

  {carrinho.map((item, index) => (
    <div
  key={`${item.id}-${item.tamanho}-${item.cor}`}
  className="flex justify-between items-center py-2"
>
  <div>
   <div>
  <div>{item.products}</div>

  <div className="text-sm text-gray-500">
    Tam: {item.tamanho}
  </div>

  <div className="text-sm text-gray-500">
    Cor: {item.cor}
  </div>

  <div className="flex items-center gap-2 mt-1">

  <button
    onClick={() =>
      alterarQuantidadeCarrinho(
        index,
        item.quantidade - 1
      )
    }
    aria-label={`Diminuir quantidade de ${item.products}`}
    className="px-2 border rounded"
  >
    -
  </button>

  <span>
    {item.quantidade}
  </span>

  <button
    onClick={() =>
      alterarQuantidadeCarrinho(
        index,
        item.quantidade + 1
      )
    }
    aria-label={`Aumentar quantidade de ${item.products}`}
    className="px-2 border rounded"
  >
    +
  </button>

</div>
</div>
<div>
  {formatarPreco(obterPrecoVenda(item) * item.quantidade)}
</div>
  </div>

  <button
    onClick={() => removerDoCarrinho(index)}
    aria-label={`Remover ${item.products} do carrinho`}
    className="rounded bg-red-50 px-2 py-1 text-sm text-red-700"
  >
    Remover
  </button>
</div>
  ))}
  <input
  value={nomeCliente}
  onChange={(e) => setNomeCliente(e.target.value)}
  placeholder="Seu nome"
  className="w-full border p-2 rounded mt-4"
/>

<input
  type="tel"
  value={telefoneCliente}
  onChange={(e) => setTelefoneCliente(e.target.value)}
  placeholder="Telefone"
  className="w-full border p-2 rounded mt-2"
/>

<input
  value={enderecoCliente}
  onChange={(e) => setEnderecoCliente(e.target.value)}
  placeholder="Endereço"
  className="w-full border p-2 rounded mt-2"
/>

<textarea
  value={observacoesCliente}
  onChange={(e) => setObservacoesCliente(e.target.value)}
  placeholder="Observações"
  className="w-full border p-2 rounded mt-2"
/>
  <div className="border-t mt-3 pt-3 font-bold">
  Total: {formatarPreco(total)}
</div>
<button
  onClick={finalizarPedido}
  className="mt-4 w-full bg-green-600 text-white p-3 rounded-lg font-bold"
>
  Finalizar Pedido
</button>
</div>
</>
)}
  <div id="inicio" className="mb-10 text-center">
  <section className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-[#70491f] via-[#8a5d2b] to-[#C58B39] px-6 py-12 text-center text-white shadow-xl sm:px-10 sm:py-20">
    <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10" />
    <div className="absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-black/10" />
    <div className="relative">
    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em]">
      Novidades Selleta
    </p>
    <h1 className="text-3xl font-bold sm:text-5xl">
      Elegância e estilo para todas as ocasiões
    </h1>
    <p className="mx-auto mt-4 max-w-2xl text-white/90">
      Descubra peças femininas selecionadas e compre com atendimento
      personalizado pelo WhatsApp.
    </p>
    <a
      href="#catalogo"
      className="mt-6 inline-flex rounded-full bg-white px-6 py-3 font-bold text-[#8a5d2b] transition hover:-translate-y-0.5"
    >
      Ver coleção
    </a>
    </div>
  </section>

</div>
</div>

      <section
        id="beneficios"
        aria-label="Diferenciais da loja"
        className="mb-12 grid gap-3 text-center sm:grid-cols-3"
      >
        <div className="rounded-2xl border border-[#8a5d2b]/10 bg-white p-5 shadow-sm">
          <strong>Atendimento próximo</strong>
          <p className="mt-1 text-sm text-gray-500">Pedido fácil pelo WhatsApp</p>
        </div>
        <div className="rounded-2xl border border-[#8a5d2b]/10 bg-white p-5 shadow-sm">
          <strong>Compra segura</strong>
          <p className="mt-1 text-sm text-gray-500">Confirmação antes de finalizar</p>
        </div>
        <div className="rounded-2xl border border-[#8a5d2b]/10 bg-white p-5 shadow-sm">
          <strong>Troca facilitada</strong>
          <p className="mt-1 text-sm text-gray-500">Consulte as condições no atendimento</p>
        </div>
      </section>

      <section id="catalogo" aria-labelledby="titulo-catalogo">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#8a5d2b]">
              Catálogo
            </p>
            <h2 id="titulo-catalogo" className="text-3xl font-bold">
              Encontre seu próximo look
            </h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            <input
              type="search"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar produto"
              aria-label="Buscar produto"
              className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-[#C58B39]"
            />
            <select
              value={categoriaSelecionada}
              onChange={(e) => setCategoriaSelecionada(e.target.value)}
              aria-label="Filtrar por categoria"
              className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-[#C58B39]"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((categoria) => (
                <option key={categoria} value={categoria}>
                  {categoria}
                </option>
              ))}
            </select>
            <select
              value={tamanhoFiltro}
              onChange={(e) => setTamanhoFiltro(e.target.value)}
              aria-label="Filtrar por tamanho"
              className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-[#C58B39]"
            >
              <option value="">Todos os tamanhos</option>
              {tamanhosDisponiveis.map((tamanho) => (
                <option key={tamanho} value={tamanho}>
                  {tamanho}
                </option>
              ))}
            </select>
            <select
              value={corFiltro}
              onChange={(e) => setCorFiltro(e.target.value)}
              aria-label="Filtrar por cor"
              className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-[#C58B39]"
            >
              <option value="">Todas as cores</option>
              {coresDisponiveis.map((cor) => (
                <option key={cor} value={cor}>
                  {cor}
                </option>
              ))}
            </select>
            <input
              type="number"
              min="0"
              step="10"
              value={precoMaximo}
              onChange={(e) => setPrecoMaximo(e.target.value)}
              placeholder="Preço máximo"
              aria-label="Filtrar por preço máximo"
              className="rounded-lg border bg-white px-4 py-3 outline-none focus:border-[#C58B39]"
            />
          </div>
        </div>

      {categorias.length > 0 && (
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          <button
            type="button"
            onClick={() => setCategoriaSelecionada("")}
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
              onClick={() => setCategoriaSelecionada(categoria)}
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
        <div className="mb-5 flex items-center justify-between rounded-xl bg-[#fff7ed] px-4 py-3 text-sm">
          <span>{produtosFiltrados.length} produto(s) encontrado(s)</span>
          <button
            type="button"
            onClick={limparFiltros}
            className="font-semibold text-[#8a5d2b] hover:underline"
          >
            Limpar filtros
          </button>
        </div>
      )}

      {carregando && (
        <div className="rounded-2xl border bg-white p-10 text-center text-gray-500">
          Carregando produtos...
        </div>
      )}

      {erroProdutos && (
        <div role="alert" className="rounded-2xl bg-red-50 p-6 text-center text-red-700">
          {erroProdutos}
        </div>
      )}

      {!carregando && !erroProdutos && produtosFiltrados.length === 0 && (
        <div className="rounded-2xl border border-dashed bg-white p-10 text-center text-gray-500">
          Nenhum produto encontrado.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produtosFiltrados.map((produto) => (
          <ProductCard
            key={produto.id}
            produto={produto}
            onOpen={() => setProdutoAberto(produto)}
          />
        ))}
      </div>
      </section>

      <section
        id="como-comprar"
        className="mt-20 rounded-3xl bg-[#2f2924] px-6 py-10 text-white sm:px-10"
      >
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#e8bd7a]">
            Simples e pessoal
          </p>
          <h2 className="mt-2 text-3xl font-bold">Como comprar na Selleta</h2>
          <p className="mt-3 text-white/70">
            Você escolhe com calma e nossa equipe confirma cada detalhe antes
            de finalizar.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ["1", "Escolha sua peça", "Veja detalhes, tamanhos, cores e estoque."],
            ["2", "Monte seu pedido", "Adicione as opções desejadas ao carrinho."],
            ["3", "Finalize no WhatsApp", "Confirme entrega e pagamento com a equipe."],
          ].map(([numero, titulo, texto]) => (
            <div key={numero} className="rounded-2xl bg-white/10 p-5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-[#C58B39] font-bold">
                {numero}
              </span>
              <h3 className="mt-4 font-bold">{titulo}</h3>
              <p className="mt-1 text-sm leading-relaxed text-white/70">{texto}</p>
            </div>
          ))}
        </div>
      </section>

      <a
        href={`https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
          "Olá! Gostaria de conhecer as novidades da Selleta Modas."
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar com a Selleta Modas pelo WhatsApp"
        className="fixed bottom-4 right-4 z-30 rounded-full bg-green-600 px-5 py-3 font-bold text-white shadow-xl transition hover:bg-green-700"
      >
        WhatsApp
      </a>

      <footer className="mt-20 border-t pt-8 pb-6 text-center text-gray-600">

  <img
    src={logoSelleta}
    alt="Selleta Modas"
    className="mx-auto w-24 mb-4 opacity-80"
  />

  <p className="font-semibold text-[#C58B39]">
    Selleta Modas
  </p>

  <p className="mt-2">
    Moda feminina para todos os estilos
  </p>

  <div className="mt-4 text-sm">

    <p>
      Desenvolvido por <a
  href="https://wa.me/5585987433260"
  target="_blank"
  rel="noopener noreferrer"
  className="text-[#C58B39] hover:underline"
>
  Thiago Maia
</a>
    </p>
  </div>

</footer>
    </main>
    </div>
  );
}
