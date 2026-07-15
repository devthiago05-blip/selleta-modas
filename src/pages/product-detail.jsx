import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import ProductOptions from "../components/ProductOptions";
import SiteHeader from "../components/SiteHeader";
import { carregarCatalogo } from "../lib/catalog";
import {
  gerarSlugProduto,
  obterImagensProduto,
  obterOpcoesDisponiveisProduto,
  obterPrecoVenda,
  temPrecoPromocional,
} from "../lib/product";

const CHAVE_CARRINHO = "selleta-modas-carrinho";

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

    document.title = `${produto.products} | Selleta Modas`;
    const descricao =
      produto.descricao || "Produto feminino selecionado pela Selleta Modas.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", descricao.slice(0, 155));
  }, [produto]);

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

  return (
    <div className="min-h-screen bg-[#fffaf4]">
      <SiteHeader
        quantidadeCarrinho={quantidadeCarrinho}
        onOpenCart={() => navigate("/?carrinho=1")}
      />

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Link to="/#catalogo" className="text-sm font-semibold text-[#8a5d2b]">
          ← Voltar ao catálogo
        </Link>

        <section className="mt-6 grid gap-8 rounded-[2rem] bg-white p-4 shadow-sm md:grid-cols-[1fr_0.9fr] md:p-8">
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

          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-[#8a5d2b]">
              {produto.categoria || "Moda feminina"}
            </p>
            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              {produto.products}
            </h1>
            <div className="mt-4">
              {temPrecoPromocional(produto) && (
                <p className="text-gray-400 line-through">
                  {formatarPreco(produto.preco)}
                </p>
              )}
              <p className="text-3xl font-bold text-[#8a5d2b]">
                {formatarPreco(obterPrecoVenda(produto))}
              </p>
            </div>
            <p className="mt-5 leading-relaxed text-gray-600">
              {produto.descricao || "Peça selecionada pela Selleta Modas."}
            </p>

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

            <div className="mt-6 grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
              <div className="rounded-xl bg-[#fff7ed] p-4">
                <strong className="block text-gray-900">Entrega</strong>
                Prazo e valor confirmados no atendimento.
              </div>
              <div className="rounded-xl bg-[#fff7ed] p-4">
                <strong className="block text-gray-900">Trocas</strong>
                Consulte condições pelo WhatsApp.
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
