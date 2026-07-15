
import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CatalogFilters from "../components/CatalogFilters";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import SiteHeader from "../components/SiteHeader";
import {
  FloatingWhatsApp,
  PurchaseGuide,
  StoreBenefits,
  StoreFooter,
  StoreHero,
} from "../components/StorefrontSections";
import { carregarCatalogo } from "../lib/catalog";
import {
  obterCoresProduto,
  obterImagensProduto,
  obterOpcoesDisponiveisProduto,
  obterTamanhosProduto,
  obterPrecoVenda,
  obterVariacoes,
} from "../lib/product";

const CHAVE_CARRINHO = "selleta-modas-carrinho";
const whatsappNumero = String(
  import.meta.env.VITE_WHATSAPP_NUMBER || "5585992903028"
).replace(/\D/g, "");
const checkoutDiretoAtivo =
  import.meta.env.VITE_DIRECT_CHECKOUT_ENABLED === "true";
const CheckoutModal = lazy(() => import("../components/CheckoutModal"));

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

const normalizarOpcaoFiltro = (valor) =>
  String(valor || "").trim().toLocaleLowerCase("pt-BR");

const obterOpcoesUnicas = (opcoes) => [
  ...new Map(
    opcoes
      .filter(Boolean)
      .map((opcao) => [normalizarOpcaoFiltro(opcao), opcao])
  ).values(),
];
const ordemTamanhos = ["PP", "P", "M", "G", "GG", "XG"];

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
  const [checkoutAberto, setCheckoutAberto] = useState(false);
  const [produtoAberto, setProdutoAberto] = useState(null);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState({});
  const [corSelecionada, setCorSelecionada] = useState({});
  const [estampaSelecionada, setEstampaSelecionada] = useState({});
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
  const [produtoAdicionado, setProdutoAdicionado] = useState(null);
  const fecharProduto = useCallback(() => setProdutoAberto(null), []);

  function aplicarSelecaoProduto(produto, selecao) {
    setTamanhoSelecionado((selecoes) => ({
      ...selecoes,
      [produto.id]: selecao.tamanho,
    }));
    setCorSelecionada((selecoes) => ({
      ...selecoes,
      [produto.id]: selecao.cor,
    }));
    setEstampaSelecionada((selecoes) => ({
      ...selecoes,
      [produto.id]: selecao.estampa,
    }));
    setQuantidadeSelecionada((selecoes) => ({
      ...selecoes,
      [produto.id]: Math.min(selecoes[produto.id] || 1, selecao.estoque || 1),
    }));
  }

  function obterSelecaoAtual(produto, sobrescrever = {}) {
    return obterOpcoesDisponiveisProduto(produto, {
      tamanho: tamanhoSelecionado[produto.id],
      cor: corSelecionada[produto.id],
      estampa: estampaSelecionada[produto.id],
      ...sobrescrever,
    });
  }

  function selecionarTamanhoProduto(produto, tamanho) {
    aplicarSelecaoProduto(produto, obterSelecaoAtual(produto, { tamanho }));
  }

  function selecionarCorProduto(produto, cor) {
    aplicarSelecaoProduto(produto, obterSelecaoAtual(produto, { cor }));
  }

  function selecionarEstampaProduto(produto, estampa) {
    aplicarSelecaoProduto(produto, obterSelecaoAtual(produto, { estampa }));
  }

  function abrirProduto(produto) {
    aplicarSelecaoProduto(produto, obterSelecaoAtual(produto));
    setProdutoAberto(produto);
  }

  function adicionarAoCarrinho(produto) {
    const variacoes = obterVariacoes(produto);
    const selecao = obterSelecaoAtual(produto);
    const tamanho = selecao.tamanho || "Único";
    const cor = selecao.cor || "Padrão";
    const estampa = selecao.estampa || "Sem estampa";
    const quantidade = quantidadeSelecionada[produto.id] || 1;
    const variacao = selecao.variacao;

    if (obterTamanhosProduto(produto).length > 0 && !tamanho) {
      setFeedback("Selecione um tamanho antes de adicionar.");
      return false;
    }

    if (obterCoresProduto(produto).length > 0 && !cor) {
      setFeedback("Selecione uma cor antes de adicionar.");
      return false;
    }

    if (variacoes.length > 0 && !variacao) {
      setFeedback("Selecione uma combinação disponível.");
      return false;
    }

    const estoqueDisponivel = Number(
      variacoes.length ? variacao.stock : selecao.estoque
    );

    if (quantidade > estoqueDisponivel) {
      setFeedback("Quantidade maior que o estoque disponível.");
      return false;
    }

    const itemCarrinho = {
      ...produto,
      variant_id: variacao?.id || null,
      tamanho,
      cor,
      estampa,
      estoque: estoqueDisponivel,
      quantidade,
    };
    const mesmaVariacao = (item) =>
      item.id === itemCarrinho.id &&
      item.tamanho === itemCarrinho.tamanho &&
      item.cor === itemCarrinho.cor &&
      (item.estampa || "Sem estampa") === itemCarrinho.estampa;
    const itemExistente = carrinho.find(mesmaVariacao);

    if (
      itemExistente &&
      itemExistente.quantidade + quantidade > estoqueDisponivel
    ) {
      setFeedback("A quantidade total ultrapassa o estoque disponível.");
      return false;
    }

    setCarrinho((itens) => {
      const itemAtual = itens.find(mesmaVariacao);

      if (itemAtual) {
        return itens.map((item) =>
          mesmaVariacao(item)
            ? { ...item, quantidade: item.quantidade + quantidade }
            : item
        );
      }

      return [...itens, itemCarrinho];
    });
    aplicarSelecaoProduto(produto, selecao);
    setProdutoAdicionado(produto.id);
    setFeedback("Produto adicionado ao carrinho.");
    return true;
  }

  function comprarAgora(produto) {
    if (adicionarAoCarrinho(produto)) {
      setCarrinhoAberto(true);
    }
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
      `Estampa: ${item.estampa || "Sem estampa"}\n` +
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
    if (!feedback) return undefined;

    const temporizador = setTimeout(() => setFeedback(""), 3500);

    return () => clearTimeout(temporizador);
  }, [feedback]);

  useEffect(() => {
    if (!produtoAdicionado) return undefined;

    const temporizador = setTimeout(() => setProdutoAdicionado(null), 1800);

    return () => clearTimeout(temporizador);
  }, [produtoAdicionado]);

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
          image: obterImagensProduto(produto),
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
    const controller = new AbortController();

    async function carregarProdutos() {
      try {
        const data = await carregarCatalogo(controller.signal);
        setProdutos(data || []);
      } catch (error) {
        if (error.name === "AbortError") return;
        setErroProdutos("Não foi possível carregar o catálogo agora.");
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }

    carregarProdutos();

    return () => {
      controller.abort();
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
  const tamanhosDisponiveis = obterOpcoesUnicas(
    produtos
      .flatMap((produto) => obterTamanhosProduto(produto))
      .map((tamanho) => tamanho.toLocaleUpperCase("pt-BR"))
  ).sort((tamanhoA, tamanhoB) => {
    const indiceA = ordemTamanhos.indexOf(tamanhoA);
    const indiceB = ordemTamanhos.indexOf(tamanhoB);
    return (indiceA < 0 ? 99 : indiceA) - (indiceB < 0 ? 99 : indiceB);
  });
  const coresDisponiveis = obterOpcoesUnicas(
    produtos.flatMap((produto) => obterCoresProduto(produto))
  );
  const produtosFiltrados = produtos.filter((produto) => {
    const produtoAtivo = produto.ativo !== false;
    const correspondeBusca = produto.products
      ?.toLowerCase()
      .includes(busca.trim().toLowerCase());
    const correspondeCategoria =
      !categoriaSelecionada || produto.categoria === categoriaSelecionada;
    const correspondeTamanho =
      !tamanhoFiltro ||
      obterTamanhosProduto(produto).some(
        (tamanho) =>
          normalizarOpcaoFiltro(tamanho) === normalizarOpcaoFiltro(tamanhoFiltro)
      );
    const correspondeCor =
      !corFiltro ||
      obterCoresProduto(produto).some(
        (cor) => normalizarOpcaoFiltro(cor) === normalizarOpcaoFiltro(corFiltro)
      );
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
    <div className="min-h-screen overflow-x-clip">
      <SiteHeader
        quantidadeCarrinho={quantidadeCarrinho}
        onOpenCart={() => setCarrinhoAberto(true)}
      />

    <main className="mx-auto min-w-0 max-w-7xl overflow-x-clip px-4 py-6 sm:px-6 sm:py-10">
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
          key={produtoAberto.id}
          produto={produtoAberto}
          tamanho={tamanhoSelecionado[produtoAberto.id] || ""}
          cor={corSelecionada[produtoAberto.id] || ""}
          estampa={estampaSelecionada[produtoAberto.id] || ""}
          quantidade={quantidadeSelecionada[produtoAberto.id] || 1}
          onTamanhoChange={(tamanho) => {
            const primeira = obterVariacoes(produtoAberto).find(
              (variacao) =>
                variacao.size === tamanho && Number(variacao.stock) > 0
            );
            setTamanhoSelecionado((selecoes) => ({
              ...selecoes,
              [produtoAberto.id]: tamanho,
            }));
            if (primeira) {
              setCorSelecionada((selecoes) => ({
                ...selecoes,
                [produtoAberto.id]: primeira.color,
              }));
              setEstampaSelecionada((selecoes) => ({
                ...selecoes,
                [produtoAberto.id]: primeira.print,
              }));
            }
          }}
          onCorChange={(cor) => {
            const primeira = obterVariacoes(produtoAberto).find(
              (variacao) =>
                variacao.size === tamanhoSelecionado[produtoAberto.id] &&
                variacao.color === cor &&
                Number(variacao.stock) > 0
            );
            setCorSelecionada((selecoes) => ({
              ...selecoes,
              [produtoAberto.id]: cor,
            }));
            if (primeira) {
              setEstampaSelecionada((selecoes) => ({
                ...selecoes,
                [produtoAberto.id]: primeira.print,
              }));
            }
          }}
          onEstampaChange={(estampa) =>
            setEstampaSelecionada((selecoes) => ({
              ...selecoes,
              [produtoAberto.id]: estampa,
            }))
          }
          onQuantidadeChange={(quantidade) =>
            setQuantidadeSelecionada((selecoes) => ({
              ...selecoes,
              [produtoAberto.id]: quantidade,
            }))
          }
          onAdicionar={() => adicionarAoCarrinho(produtoAberto)}
          adicionado={produtoAdicionado === produtoAberto.id}
          onClose={fecharProduto}
        />
      )}

      {checkoutAberto && (
        <Suspense fallback={null}>
        <CheckoutModal
          carrinho={carrinho}
          total={total}
          onClose={() => setCheckoutAberto(false)}
          onSuccess={() => {
            setCarrinho([]);
            setCarrinhoAberto(false);
          }}
        />
        </Suspense>
      )}

      {carrinhoAberto && (
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
  key={`${item.id}-${item.tamanho}-${item.cor}-${item.estampa || ""}`}
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

  <div className="text-sm text-gray-500">
    Estampa: {item.estampa || "Sem estampa"}
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
  Finalizar pelo WhatsApp
</button>

{checkoutDiretoAtivo && (
  <button
    type="button"
    onClick={() => setCheckoutAberto(true)}
    disabled={carrinho.length === 0}
    className="mt-2 w-full rounded-lg bg-[#8a5d2b] p-3 font-bold text-white"
  >
    Escolher pagamento e finalizar
  </button>
)}

<Link
  to="/pedido"
  className="mt-3 block text-center text-sm font-semibold text-[#8a5d2b] hover:underline"
>
  Acompanhar um pedido
</Link>
</div>
</>
)}
      <StoreHero whatsappNumero={whatsappNumero} />
      <StoreBenefits />

      <section id="catalogo" aria-labelledby="titulo-catalogo" className="min-w-0">
        <CatalogFilters
          busca={busca}
          categoriaSelecionada={categoriaSelecionada}
          tamanhoFiltro={tamanhoFiltro}
          corFiltro={corFiltro}
          precoMaximo={precoMaximo}
          categorias={categorias}
          tamanhos={tamanhosDisponiveis}
          cores={coresDisponiveis}
          filtrosAtivos={Boolean(filtrosAtivos)}
          totalEncontrado={produtosFiltrados.length}
          onBuscaChange={setBusca}
          onCategoriaChange={setCategoriaSelecionada}
          onTamanhoChange={setTamanhoFiltro}
          onCorChange={setCorFiltro}
          onPrecoChange={setPrecoMaximo}
          onLimpar={limparFiltros}
        />

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

      <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {produtosFiltrados.map((produto) => (
          <ProductCard
            key={produto.id}
            produto={produto}
            tamanho={tamanhoSelecionado[produto.id]}
            cor={corSelecionada[produto.id]}
            estampa={estampaSelecionada[produto.id]}
            adicionado={produtoAdicionado === produto.id}
            onTamanhoChange={(tamanho) =>
              selecionarTamanhoProduto(produto, tamanho)
            }
            onCorChange={(cor) => selecionarCorProduto(produto, cor)}
            onEstampaChange={(estampa) =>
              selecionarEstampaProduto(produto, estampa)
            }
            onAdicionar={() => adicionarAoCarrinho(produto)}
            onComprarAgora={() => comprarAgora(produto)}
            onOpen={() => abrirProduto(produto)}
          />
        ))}
      </div>
      </section>

      <PurchaseGuide checkoutDiretoAtivo={checkoutDiretoAtivo} />
      <FloatingWhatsApp whatsappNumero={whatsappNumero} />
      <StoreFooter whatsappNumero={whatsappNumero} />
    </main>
    </div>
  );
}
