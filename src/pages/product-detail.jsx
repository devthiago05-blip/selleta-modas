import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductOptions from "../components/ProductOptions";
import SiteHeader from "../components/SiteHeader";
import { carregarCatalogo } from "../lib/catalog";
import {
  gerarSlugProduto,
  obterImagemPrincipal,
  obterImagensProduto,
  obterOpcoesDisponiveisProduto,
  obterPrecoVenda,
  obterUrlProduto,
  temPrecoPromocional,
} from "../lib/product";

const CHAVE_CARRINHO = "selleta-modas-carrinho";
const whatsappNumero = String(
  import.meta.env.VITE_WHATSAPP_NUMBER || "5585992903028"
).replace(/\D/g, "");

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

function lerCarrinho() {
  try {
    const salvo = localStorage.getItem(CHAVE_CARRINHO);
    return salvo ? JSON.parse(salvo) : [];
  } catch {
    return [];
  }
}

function definirMeta(seletor, atributos) {
  let meta = document.querySelector(seletor);

  if (!meta) {
    meta = document.createElement("meta");
    document.head.appendChild(meta);
  }

  Object.entries(atributos).forEach(([chave, valor]) => {
    meta.setAttribute(chave, valor);
  });
}

function definirCanonical(href) {
  let link = document.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  link.setAttribute("href", href);
}

export default function ProductDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tamanho, setTamanho] = useState("");
  const [cor, setCor] = useState("");
  const [estampa, setEstampa] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [feedback, setFeedback] = useState("");
  const [carrinho, setCarrinho] = useState(lerCarrinho);

  const produto = useMemo(
    () =>
      produtos.find(
        (item) => item.ativo !== false && gerarSlugProduto(item) === slug
      ),
    [produtos, slug]
  );
  const opcoes = produto
    ? obterOpcoesDisponiveisProduto(produto, { tamanho, cor, estampa })
    : null;
  const imagens = useMemo(
    () => (produto ? obterImagensProduto(produto) : []),
    [produto]
  );
  const produtosRelacionados = useMemo(() => {
    if (!produto) return [];

    return produtos
      .filter(
        (item) =>
          item.ativo !== false &&
          item.id !== produto.id &&
          item.categoria &&
          item.categoria === produto.categoria
      )
      .slice(0, 4);
  }, [produto, produtos]);
  const [imagemAtiva, setImagemAtiva] = useState("");
  const quantidadeCarrinho = carrinho.reduce(
    (total, item) => total + Number(item.quantidade || 0),
    0
  );

  useEffect(() => {
    const controller = new AbortController();

    async function carregar() {
      try {
        const data = await carregarCatalogo(controller.signal);
        setProdutos(data || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErro("Não foi possível carregar este produto agora.");
        }
      } finally {
        if (!controller.signal.aborted) setCarregando(false);
      }
    }

    carregar();

    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!produto) return;

    const urlProduto = window.location.href;
    document.title = `${produto.products} | Selleta Modas`;
    const descricao =
      produto.descricao || "Produto feminino selecionado pela Selleta Modas.";
    const descricaoCurta = descricao.slice(0, 155);
    const imagem = obterImagensProduto(produto)[0];

    definirMeta('meta[name="description"]', {
      name: "description",
      content: descricaoCurta,
    });
    definirMeta('meta[property="og:title"]', {
      property: "og:title",
      content: `${produto.products} | Selleta Modas`,
    });
    definirMeta('meta[property="og:description"]', {
      property: "og:description",
      content: descricaoCurta,
    });
    definirMeta('meta[property="og:url"]', {
      property: "og:url",
      content: urlProduto,
    });
    definirMeta('meta[property="og:type"]', {
      property: "og:type",
      content: "product",
    });
    if (imagem) {
      definirMeta('meta[property="og:image"]', {
        property: "og:image",
        content: imagem,
      });
    }
    definirCanonical(urlProduto);
  }, [produto]);

  useEffect(() => {
    if (!produto) return undefined;

    const scriptAnterior = document.getElementById("selleta-single-product-schema");
    scriptAnterior?.remove();

    const urlProduto = `${window.location.origin}${obterUrlProduto(produto)}`;
    const precoVenda = obterPrecoVenda(produto);
    const script = document.createElement("script");

    script.id = "selleta-single-product-schema";
    script.type = "application/ld+json";
    script.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: produto.products,
      description:
        produto.descricao || "Produto feminino selecionado pela Selleta Modas.",
      image: imagens,
      category: produto.categoria || "Moda feminina",
      brand: {
        "@type": "Brand",
        name: "Selleta Modas",
      },
      offers: {
        "@type": "Offer",
        url: urlProduto,
        priceCurrency: "BRL",
        price: precoVenda.toFixed(2),
        availability:
          Number(produto.estoque) > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
      },
    });

    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [imagens, produto]);

  function selecionarTamanho(novoTamanho) {
    const novaSelecao = obterOpcoesDisponiveisProduto(produto, {
      tamanho: novoTamanho,
      cor,
      estampa,
    });
    setTamanho(novaSelecao.tamanho);
    setCor(novaSelecao.cor);
    setEstampa(novaSelecao.estampa);
    setQuantidade(1);
  }

  function selecionarCor(novaCor) {
    const novaSelecao = obterOpcoesDisponiveisProduto(produto, {
      tamanho: opcoes?.tamanho,
      cor: novaCor,
      estampa,
    });
    setTamanho(novaSelecao.tamanho);
    setCor(novaSelecao.cor);
    setEstampa(novaSelecao.estampa);
    setQuantidade(1);
  }

  function selecionarEstampa(novaEstampa) {
    setEstampa(novaEstampa);
  }

  function adicionarAoCarrinho() {
    if (!produto || !opcoes) return false;

    const estoque = opcoes.estoque;
    const exigeVariacao =
      Array.isArray(produto.product_variants) &&
      produto.product_variants.some((variacao) => variacao.active !== false);

    if (estoque <= 0 || (exigeVariacao && !opcoes.variacao)) {
      setFeedback("Selecione uma combinação disponível.");
      return false;
    }

    const quantidadeFinal = Math.min(Math.max(1, quantidade), estoque);
    const itemCarrinho = {
      ...produto,
      variant_id: opcoes.variacao?.id || null,
      tamanho: opcoes.tamanho,
      cor: opcoes.cor,
      estampa: opcoes.estampa,
      estoque,
      quantidade: quantidadeFinal,
    };
    const mesmaVariacao = (item) =>
      item.id === itemCarrinho.id &&
      item.tamanho === itemCarrinho.tamanho &&
      item.cor === itemCarrinho.cor &&
      (item.estampa || "Sem estampa") === itemCarrinho.estampa;
    const itemExistente = carrinho.find(mesmaVariacao);

    if (itemExistente && itemExistente.quantidade + quantidadeFinal > estoque) {
      setFeedback("A quantidade total ultrapassa o estoque disponível.");
      return false;
    }

    const atualizado = itemExistente
      ? carrinho.map((item) =>
          mesmaVariacao(item)
            ? { ...item, quantidade: item.quantidade + quantidadeFinal }
            : item
        )
      : [...carrinho, itemCarrinho];

    setCarrinho(atualizado);
    localStorage.setItem(CHAVE_CARRINHO, JSON.stringify(atualizado));
    setFeedback("Produto adicionado ao carrinho.");
    return true;
  }

  function comprarAgora() {
    if (adicionarAoCarrinho()) {
      navigate("/?carrinho=1");
    }
  }

  async function copiarLinkProduto() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setFeedback("Link do produto copiado.");
    } catch {
      setFeedback("Não foi possível copiar automaticamente. Copie o link da barra do navegador.");
    }
  }

  if (carregando) {
    return (
      <main className="grid min-h-screen place-items-center text-gray-500">
        Carregando produto...
      </main>
    );
  }

  if (erro || !produto || !opcoes) {
    return (
      <main className="mx-auto grid min-h-screen max-w-3xl place-items-center px-4 text-center">
        <div>
          <h1 className="text-2xl font-bold">Produto não encontrado</h1>
          <p className="mt-2 text-gray-500">
            {erro || "Este produto pode ter sido removido ou estar inativo."}
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex rounded-xl bg-[#8a5d2b] px-5 py-3 font-semibold text-white"
          >
            Voltar para a loja
          </Link>
        </div>
      </main>
    );
  }

  const imagemPrincipal = imagens.includes(imagemAtiva)
    ? imagemAtiva
    : imagens[0] || "";
  const precoVenda = obterPrecoVenda(produto);
  const possuiPromocao = temPrecoPromocional(produto);
  const economia = possuiPromocao
    ? Math.max(0, Number(produto.preco) - precoVenda)
    : 0;
  const emEstoque = opcoes.estoque > 0;
  const linkWhatsAppProduto = `https://wa.me/${whatsappNumero}?text=${encodeURIComponent(
    `Olá! Gostaria de tirar uma dúvida sobre ${produto.products}: ${window.location.href}`
  )}`;

  return (
    <div className="min-h-screen bg-[#fffaf4]">
      <SiteHeader
        quantidadeCarrinho={quantidadeCarrinho}
        onOpenCart={() => navigate("/?carrinho=1")}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <nav
            aria-label="Caminho do produto"
            className="flex flex-wrap items-center gap-2 text-sm text-gray-500"
          >
            <Link to="/" className="font-semibold text-[#8a5d2b]">
              Início
            </Link>
            <span aria-hidden="true">/</span>
            <Link to="/#catalogo" className="font-semibold text-[#8a5d2b]">
              Catálogo
            </Link>
            {produto.categoria && (
              <>
                <span aria-hidden="true">/</span>
                <span>{produto.categoria}</span>
              </>
            )}
          </nav>
          <button
            type="button"
            onClick={copiarLinkProduto}
            className="rounded-full border border-[#8a5d2b]/20 px-4 py-2 text-sm font-semibold text-[#8a5d2b] transition hover:bg-[#fff7ed]"
          >
            Copiar link do produto
          </button>
        </div>

        <section className="mt-6 grid items-start gap-8 rounded-[2rem] bg-white p-4 shadow-sm md:grid-cols-[1fr_0.9fr] md:p-8">
          <div>
            {imagemPrincipal ? (
              <img
                src={imagemPrincipal}
                alt={produto.products}
                className="aspect-[4/5] w-full rounded-3xl border bg-[#f8f6f3] object-contain"
              />
            ) : (
              <div className="grid aspect-[4/5] place-items-center rounded-3xl bg-gray-100 text-gray-500">
                Imagem indisponível
              </div>
            )}

            {imagens.length > 1 && (
              <div className="mt-3 grid grid-cols-5 gap-2">
                {imagens.map((imagem, index) => (
                  <button
                    key={imagem}
                    type="button"
                    onClick={() => setImagemAtiva(imagem)}
                    aria-label={`Ver foto ${index + 1}`}
                    className={`rounded-xl border bg-[#f8f6f3] p-1 ${
                      imagem === imagemPrincipal
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

          <div className="md:sticky md:top-24">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold uppercase tracking-wider text-[#8a5d2b]">
                {produto.categoria || "Moda feminina"}
              </p>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  emEstoque
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {emEstoque ? "Em estoque" : "Esgotado"}
              </span>
            </div>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {produto.products}
            </h1>
            <div className="mt-4">
              {possuiPromocao && (
                <p className="text-gray-400 line-through">
                  {formatarPreco(produto.preco)}
                </p>
              )}
              <p className="text-3xl font-bold text-[#8a5d2b]">
                {formatarPreco(precoVenda)}
              </p>
              <p className="mt-1 text-sm font-medium text-gray-500">
                {economia > 0
                  ? `Economize ${formatarPreco(economia)} nesta peça.`
                  : "Finalize pelo site ou fale com a equipe no WhatsApp."}
              </p>
            </div>
            <p className="mt-5 leading-relaxed text-gray-600">
              {produto.descricao || "Peça selecionada pela Selleta Modas."}
            </p>

            <div className="mt-5 grid gap-2 rounded-2xl bg-[#fff7ed] p-4 text-sm text-gray-600 sm:grid-cols-3">
              <div>
                <span className="block text-xs font-bold uppercase text-[#8a5d2b]">
                  Tamanho
                </span>
                <strong className="text-gray-900">{opcoes.tamanho}</strong>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-[#8a5d2b]">
                  Cor
                </span>
                <strong className="text-gray-900">{opcoes.cor}</strong>
              </div>
              <div>
                <span className="block text-xs font-bold uppercase text-[#8a5d2b]">
                  Estoque
                </span>
                <strong className="text-gray-900">
                  {emEstoque ? `${opcoes.estoque} un.` : "Indisponível"}
                </strong>
              </div>
            </div>

            <div className="my-7">
              <ProductOptions
                produto={produto}
                tamanho={opcoes.tamanho}
                cor={opcoes.cor}
                estampa={opcoes.estampa}
                quantidade={quantidade}
                onTamanhoChange={selecionarTamanho}
                onCorChange={selecionarCor}
                onEstampaChange={selecionarEstampa}
                onQuantidadeChange={setQuantidade}
              />
            </div>

            {feedback && (
              <p className="mb-3 rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                {feedback}
              </p>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={adicionarAoCarrinho}
                disabled={opcoes.estoque <= 0}
                className="rounded-xl border border-[#8a5d2b]/25 p-4 font-bold text-[#8a5d2b] transition hover:bg-[#fff7ed] disabled:opacity-50"
              >
                Adicionar ao carrinho
              </button>
              <button
                type="button"
                onClick={comprarAgora}
                disabled={opcoes.estoque <= 0}
                className="rounded-xl bg-[#8a5d2b] p-4 font-bold text-white transition hover:bg-[#70491f] disabled:opacity-50"
              >
                Comprar agora
              </button>
            </div>

            <a
              href={linkWhatsAppProduto}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 flex items-center justify-center rounded-xl bg-green-600 p-4 font-bold text-white transition hover:bg-green-700"
            >
              Tirar dúvida sobre esta peça
            </a>

            <div className="mt-6 grid gap-3 text-sm text-gray-600 sm:grid-cols-3">
              <div className="rounded-xl bg-[#fff7ed] p-4">
                <strong className="block text-gray-900">Entrega</strong>
                Prazo e valor confirmados no atendimento.
              </div>
              <div className="rounded-xl bg-[#fff7ed] p-4">
                <strong className="block text-gray-900">Trocas</strong>
                Consulte condições pelo WhatsApp.
              </div>
              <div className="rounded-xl bg-[#fff7ed] p-4">
                <strong className="block text-gray-900">Pedido</strong>
                Acompanhe status e pagamento depois da compra.
              </div>
            </div>
          </div>
        </section>

        {produtosRelacionados.length > 0 && (
          <section className="mt-10">
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#8a5d2b]">
                  Continue olhando
                </p>
                <h2 className="mt-1 text-2xl font-bold">
                  Peças da mesma categoria
                </h2>
              </div>
              <Link
                to="/#catalogo"
                className="hidden text-sm font-semibold text-[#8a5d2b] hover:underline sm:block"
              >
                Ver catálogo
              </Link>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {produtosRelacionados.map((relacionado) => (
                <Link
                  key={relacionado.id}
                  to={obterUrlProduto(relacionado)}
                  onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
                  className="group overflow-hidden rounded-2xl border border-[#8a5d2b]/10 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  {obterImagemPrincipal(relacionado) ? (
                    <img
                      src={obterImagemPrincipal(relacionado)}
                      alt={relacionado.products}
                      loading="lazy"
                      decoding="async"
                      className="h-64 w-full bg-[#f8f1e9] object-contain transition duration-500 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="grid h-64 place-items-center bg-[#fff7ed] text-sm text-gray-400">
                      Imagem indisponível
                    </div>
                  )}
                  <div className="p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-[#8a5d2b]">
                      {relacionado.categoria}
                    </p>
                    <h3 className="mt-1 line-clamp-2 font-bold group-hover:text-[#8a5d2b]">
                      {relacionado.products}
                    </h3>
                    <p className="mt-2 font-bold text-[#8a5d2b]">
                      {formatarPreco(obterPrecoVenda(relacionado))}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
