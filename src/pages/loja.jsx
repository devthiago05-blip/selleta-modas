
import { lazy, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import CatalogFilters from "../components/CatalogFilters";
import ProductCard from "../components/ProductCard";
import ProductModal from "../components/ProductModal";
import SiteHeader from "../components/SiteHeader";
import {
  CollectionHighlights,
  FloatingWhatsApp,
  PurchaseGuide,
  StoreBenefits,
  StoreFooter,
  StoreHero,
  TrustSection,
} from "../components/StorefrontSections";
import { carregarCatalogo } from "../lib/catalog";
import {
  obterCoresProduto,
  obterImagemPrincipal,
  obterImagensProduto,
  obterOpcoesDisponiveisProduto,
  obterTamanhosProduto,
  obterUrlProduto,
  obterPrecoVenda,
  temPrecoPromocional,
  obterVariacoes,
} from "../lib/product";
import { criarUrlAbsoluta } from "../lib/seo";

const CHAVE_CARRINHO = "selleta-modas-carrinho";
const whatsappNumero = String(
  import.meta.env.VITE_WHATSAPP_NUMBER || "5585992903028"
).replace(/\D/g, "");
const checkoutDiretoAtivo =
  import.meta.env.VITE_DIRECT_CHECKOUT_ENABLED !== "false";
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
  const [carrinhoAberto, setCarrinhoAberto] = useState(() => {
    try {
      return new URLSearchParams(window.location.search).get("carrinho") === "1";
    } catch {
      return false;
    }
  });
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
  const [animacaoCarrinho, setAnimacaoCarrinho] = useState(null);
  const botaoCarrinhoRef = useRef(null);
  const animacaoCarrinhoTimeoutRef = useRef(null);
  const animacaoCarrinhoIdRef = useRef(0);
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

  function iniciarAnimacaoCarrinho(produto, evento) {
    const origem = evento?.currentTarget?.getBoundingClientRect?.();
    const destino = botaoCarrinhoRef.current?.getBoundingClientRect?.();
    const movimentoReduzido = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)"
    )?.matches;

    if (!origem || !destino || movimentoReduzido) return;

    animacaoCarrinhoIdRef.current += 1;
    const id = `${produto.id}-${animacaoCarrinhoIdRef.current}`;
    const imagem = obterImagemPrincipal(produto);
    const tamanho = 56;
    const centroOrigemX = origem.left + origem.width / 2 - tamanho / 2;
    const centroOrigemY = origem.top + origem.height / 2 - tamanho / 2;
    const centroDestinoX = destino.left + destino.width / 2 - tamanho / 2;
    const centroDestinoY = destino.top + destino.height / 2 - tamanho / 2;

    if (animacaoCarrinhoTimeoutRef.current) {
      clearTimeout(animacaoCarrinhoTimeoutRef.current);
    }

    setAnimacaoCarrinho({
      id,
      imagem,
      inicioX: `${centroOrigemX}px`,
      inicioY: `${centroOrigemY}px`,
      fimX: `${centroDestinoX}px`,
      fimY: `${centroDestinoY}px`,
    });

    animacaoCarrinhoTimeoutRef.current = setTimeout(() => {
      setAnimacaoCarrinho((animacaoAtual) =>
        animacaoAtual?.id === id ? null : animacaoAtual
      );
    }, 760);
  }

  function adicionarAoCarrinho(produto, evento) {
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
    iniciarAnimacaoCarrinho(produto, evento);
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
    if (window.location.search.includes("carrinho=1")) {
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

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
    return () => {
      if (animacaoCarrinhoTimeoutRef.current) {
        clearTimeout(animacaoCarrinhoTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const produtosAtivos = produtos.filter((produto) => produto.ativo !== false);

    if (produtosAtivos.length === 0) return undefined;

    document.getElementById("selleta-product-schema")?.remove();

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
          image: obterImagensProduto(produto).map(criarUrlAbsoluta),
          category: produto.categoria || undefined,
          brand: {
            "@type": "Brand",
            name: "Selleta Modas",
          },
          offers: {
            "@type": "Offer",
            url: criarUrlAbsoluta(obterUrlProduto(produto)),
            priceCurrency: "BRL",
            price: obterPrecoVenda(produto).toFixed(2),
            itemCondition: "https://schema.org/NewCondition",
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
  const produtosAtivos = produtos.filter((produto) => produto.ativo !== false);
  const categorias = [
    ...new Set(produtosAtivos.map((produto) => produto.categoria).filter(Boolean)),
  ];
  const tamanhosDisponiveis = obterOpcoesUnicas(
    produtosAtivos
      .flatMap((produto) => obterTamanhosProduto(produto))
      .map((tamanho) => tamanho.toLocaleUpperCase("pt-BR"))
  ).sort((tamanhoA, tamanhoB) => {
    const indiceA = ordemTamanhos.indexOf(tamanhoA);
    const indiceB = ordemTamanhos.indexOf(tamanhoB);
    return (indiceA < 0 ? 99 : indiceA) - (indiceB < 0 ? 99 : indiceB);
  });
  const coresDisponiveis = obterOpcoesUnicas(
    produtosAtivos.flatMap((produto) => obterCoresProduto(produto))
  );
  const totalPromocoes = produtosAtivos.filter(temPrecoPromocional).length;
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
        cartButtonRef={botaoCarrinhoRef}
      />

      {animacaoCarrinho && (
        <div
          className="animate-cart-fly pointer-events-none fixed left-0 top-0 z-[80] grid h-14 w-14 place-items-center overflow-hidden rounded-2xl border border-white bg-white shadow-2xl"
          style={{
            "--fly-start-x": animacaoCarrinho.inicioX,
            "--fly-start-y": animacaoCarrinho.inicioY,
            "--fly-end-x": animacaoCarrinho.fimX,
            "--fly-end-y": animacaoCarrinho.fimY,
          }}
          aria-hidden="true"
        >
          {animacaoCarrinho.imagem ? (
            <img
              src={animacaoCarrinho.imagem}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl">🛍️</span>
          )}
        </div>
      )}

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
          onAdicionar={(evento) => adicionarAoCarrinho(produtoAberto, evento)}
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
            className="fixed inset-0 z-40 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setCarrinhoAberto(false)}
            aria-hidden="true"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-carrinho"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col overflow-hidden bg-[#fffaf5] shadow-2xl"
          >
            <div className="border-b border-[#8a5d2b]/10 bg-white/95 p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-[#8a5d2b] text-white shadow-md">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.8}
                      stroke="currentColor"
                      className="h-6 w-6"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.25 8.25h9.5c.9 0 1.6.77 1.5 1.66l-.7 6.35A2.25 2.25 0 0115.31 18.25H8.69a2.25 2.25 0 01-2.24-1.99l-.7-6.35a1.5 1.5 0 011.5-1.66z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9 8.25a3 3 0 016 0M9.5 12h5"
                      />
                    </svg>
                  </span>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8a5d2b]">
                      Carrinho
                    </p>
                    <h2 id="titulo-carrinho" className="text-xl font-bold">
                      Resumo do pedido
                    </h2>
                    <p className="text-sm text-gray-500">
                      {quantidadeCarrinho} item(ns) selecionado(s)
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCarrinhoAberto(false)}
                  aria-label="Fechar carrinho"
                  className="grid h-10 w-10 place-items-center rounded-full bg-gray-100 text-2xl leading-none text-gray-600 transition hover:bg-gray-200 hover:text-gray-900"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              {carrinho.length === 0 ? (
                <div className="grid min-h-[18rem] place-items-center rounded-3xl border border-dashed border-[#8a5d2b]/20 bg-white p-8 text-center">
                  <div>
                    <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[#fff2df] text-[#8a5d2b]">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1.8}
                        stroke="currentColor"
                        className="h-8 w-8"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M7.25 8.25h9.5c.9 0 1.6.77 1.5 1.66l-.7 6.35A2.25 2.25 0 0115.31 18.25H8.69a2.25 2.25 0 01-2.24-1.99l-.7-6.35a1.5 1.5 0 011.5-1.66zM9 8.25a3 3 0 016 0"
                        />
                      </svg>
                    </div>
                    <p className="mt-4 font-bold">Seu carrinho está vazio</p>
                    <p className="mt-1 text-sm text-gray-500">
                      Escolha uma peça, tamanho e cor para montar o pedido.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {carrinho.map((item, index) => {
                    const imagemItem = obterImagemPrincipal(item);

                    return (
                      <article
                        key={`${item.id}-${item.tamanho}-${item.cor}-${item.estampa || ""}`}
                        className="rounded-2xl border border-[#8a5d2b]/10 bg-white p-3 shadow-sm"
                      >
                        <div className="flex gap-3">
                          <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-[#f8f6f3]">
                            {imagemItem ? (
                              <img
                                src={imagemItem}
                                alt={item.products}
                                className="h-full w-full object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="grid h-full place-items-center text-xl">
                                🛍️
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <h3 className="line-clamp-2 font-bold leading-snug">
                                  {item.products}
                                </h3>
                                <p className="mt-1 text-xs text-gray-500">
                                  Tam: {item.tamanho} · Cor: {item.cor}
                                </p>
                                {item.estampa && item.estampa !== "Sem estampa" && (
                                  <p className="text-xs text-gray-500">
                                    Estampa: {item.estampa}
                                  </p>
                                )}
                              </div>
                              <strong className="whitespace-nowrap text-sm text-[#8a5d2b]">
                                {formatarPreco(
                                  obterPrecoVenda(item) * item.quantidade
                                )}
                              </strong>
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-3">
                              <div className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 p-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    alterarQuantidadeCarrinho(
                                      index,
                                      item.quantidade - 1
                                    )
                                  }
                                  disabled={item.quantidade <= 1}
                                  aria-label={`Diminuir quantidade de ${item.products}`}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-white font-bold text-gray-700 shadow-sm"
                                >
                                  −
                                </button>
                                <span className="grid min-w-9 place-items-center text-sm font-bold">
                                  {item.quantidade}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    alterarQuantidadeCarrinho(
                                      index,
                                      item.quantidade + 1
                                    )
                                  }
                                  disabled={
                                    item.quantidade >= Number(item.estoque || 0)
                                  }
                                  aria-label={`Aumentar quantidade de ${item.products}`}
                                  className="grid h-8 w-8 place-items-center rounded-full bg-white font-bold text-gray-700 shadow-sm"
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removerDoCarrinho(index)}
                                aria-label={`Remover ${item.products} do carrinho`}
                                className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700 transition hover:bg-red-100"
                              >
                                Remover
                              </button>
                            </div>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              <div className="mt-5 rounded-3xl border border-[#8a5d2b]/10 bg-white p-4 shadow-sm">
                <h3 className="font-bold">Dados para atendimento</h3>
                <div className="mt-3 space-y-2">
                  <input
                    value={nomeCliente}
                    onChange={(e) => setNomeCliente(e.target.value)}
                    placeholder="Seu nome"
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none transition focus:border-[#C58B39] focus:ring-2 focus:ring-[#C58B39]/20"
                  />

                  <input
                    type="tel"
                    value={telefoneCliente}
                    onChange={(e) => setTelefoneCliente(e.target.value)}
                    placeholder="Telefone"
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none transition focus:border-[#C58B39] focus:ring-2 focus:ring-[#C58B39]/20"
                  />

                  <input
                    value={enderecoCliente}
                    onChange={(e) => setEnderecoCliente(e.target.value)}
                    placeholder="Endereço ou bairro"
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none transition focus:border-[#C58B39] focus:ring-2 focus:ring-[#C58B39]/20"
                  />

                  <textarea
                    value={observacoesCliente}
                    onChange={(e) => setObservacoesCliente(e.target.value)}
                    placeholder="Observações"
                    rows={3}
                    className="w-full rounded-xl border border-gray-200 bg-white p-3 outline-none transition focus:border-[#C58B39] focus:ring-2 focus:ring-[#C58B39]/20"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-[#8a5d2b]/10 bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm text-gray-500">Subtotal</span>
                <strong className="text-2xl text-[#8a5d2b]">
                  {formatarPreco(total)}
                </strong>
              </div>

              <button
                type="button"
                onClick={finalizarPedido}
                disabled={carrinho.length === 0}
                className="w-full rounded-2xl bg-green-600 p-3 font-bold text-white shadow-lg shadow-green-600/20 transition hover:bg-green-700"
              >
                Finalizar pelo WhatsApp
              </button>

              {checkoutDiretoAtivo && (
                <button
                  type="button"
                  onClick={() => setCheckoutAberto(true)}
                  disabled={carrinho.length === 0}
                  className="mt-2 w-full rounded-2xl bg-[#8a5d2b] p-3 font-bold text-white shadow-lg shadow-[#8a5d2b]/20 transition hover:bg-[#70491f]"
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
          </aside>
        </>
      )}
      <StoreHero whatsappNumero={whatsappNumero} />
      <CollectionHighlights
        totalProdutos={produtosAtivos.length}
        totalCategorias={categorias.length}
        totalPromocoes={totalPromocoes}
      />
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
        <div className="rounded-3xl border border-dashed border-[#8a5d2b]/20 bg-white p-10 text-center">
          <p className="text-xl font-bold text-[#2f2924]">
            Nenhuma peça encontrada
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
            Tente limpar os filtros ou chame a Selleta no WhatsApp para receber
            ajuda com tamanho, cor e disponibilidade.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            <button
              type="button"
              onClick={limparFiltros}
              className="rounded-xl border border-[#8a5d2b]/25 px-5 py-3 font-semibold text-[#8a5d2b]"
            >
              Limpar filtros
            </button>
            <a
              href={`https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
                "Olá! Preciso de ajuda para encontrar uma peça da Selleta Modas."
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-green-600 px-5 py-3 font-semibold text-white"
            >
              Pedir ajuda no WhatsApp
            </a>
          </div>
        </div>
      )}

      <div className="grid min-w-0 auto-rows-fr grid-cols-1 items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            onAdicionar={(evento) => adicionarAoCarrinho(produto, evento)}
            onComprarAgora={() => comprarAgora(produto)}
            onOpen={() => abrirProduto(produto)}
          />
        ))}
      </div>
      </section>

      <PurchaseGuide checkoutDiretoAtivo={checkoutDiretoAtivo} />
      <TrustSection />
      <FloatingWhatsApp whatsappNumero={whatsappNumero} />
      <StoreFooter whatsappNumero={whatsappNumero} />
    </main>
    </div>
  );
}
