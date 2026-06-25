import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

const campoClasse =
  "w-full rounded-lg border border-gray-300 bg-white p-3 outline-none transition focus:border-[#C58B39] focus:ring-2 focus:ring-[#C58B39]/20";

const formatarPreco = (valor) =>
  Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

export default function Admin() {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [imagem, setImagem] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [tamanhos, setTamanhos] = useState("");
  const [cores, setCores] = useState("");
  const [produtos, setProdutos] = useState([]);
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [produtoParaExcluir, setProdutoParaExcluir] = useState(null);
  const [carregandoPagina, setCarregandoPagina] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const navigate = useNavigate();

  const carregarProdutos = useCallback(async () => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("products");

    if (error) {
      setFeedback({
        tipo: "erro",
        mensagem: "Não foi possível carregar os produtos.",
      });
      return;
    }

    setProdutos(data || []);
  }, []);

  function limparFormulario() {
    setNome("");
    setCategoria("");
    setPreco("");
    setEstoque("");
    setImagem(null);
    setDescricao("");
    setTamanhos("");
    setCores("");
    setProdutoEditando(null);
  }

  function editarProduto(produto) {
    setProdutoEditando(produto);
    setNome(produto.products || "");
    setCategoria(produto.categoria || "");
    setPreco(String(produto.preco ?? ""));
    setEstoque(String(produto.estoque ?? ""));
    setDescricao(produto.descricao || "");
    setTamanhos(produto.tamanhos || "");
    setCores(produto.cores || "");
    setFeedback(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function confirmarExclusao() {
    if (!produtoParaExcluir) return;

    const { error } = await supabase
      .from("products")
      .delete()
      .eq("id", produtoParaExcluir.id);

    if (error) {
      setFeedback({
        tipo: "erro",
        mensagem: "Não foi possível excluir o produto.",
      });
      return;
    }

    setProdutoParaExcluir(null);
    setFeedback({
      tipo: "sucesso",
      mensagem: "Produto excluído com sucesso.",
    });
    await carregarProdutos();
  }

  async function salvarProduto(evento) {
    evento.preventDefault();
    setFeedback(null);

    const precoFormatado = Number(preco.replace(",", "."));
    const estoqueFormatado = Number(estoque);

    if (
      !nome.trim() ||
      !categoria ||
      !Number.isFinite(precoFormatado) ||
      precoFormatado <= 0 ||
      !Number.isInteger(estoqueFormatado) ||
      estoqueFormatado < 0
    ) {
      setFeedback({
        tipo: "erro",
        mensagem: "Preencha nome, categoria, preço e estoque com valores válidos.",
      });
      return;
    }

    if (
      imagem &&
      (!imagem.type.startsWith("image/") || imagem.size > 5 * 1024 * 1024)
    ) {
      setFeedback({
        tipo: "erro",
        mensagem: "A imagem deve ser válida e ter no máximo 5 MB.",
      });
      return;
    }

    setSalvando(true);
    let imagemUrl = produtoEditando?.imagem || null;

    if (imagem) {
      const nomeSeguro = imagem.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-");
      const nomeArquivo = `${Date.now()}-${nomeSeguro}`;

      const { error: uploadError } = await supabase.storage
        .from("produtos")
        .upload(nomeArquivo, imagem, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setFeedback({
          tipo: "erro",
          mensagem: "Não foi possível enviar a imagem.",
        });
        setSalvando(false);
        return;
      }

      const { data } = supabase.storage
        .from("produtos")
        .getPublicUrl(nomeArquivo);

      imagemUrl = data.publicUrl;
    }

    const dadosProduto = {
      products: nome.trim(),
      categoria,
      preco: precoFormatado,
      estoque: estoqueFormatado,
      imagem: imagemUrl,
      descricao: descricao.trim(),
      tamanhos: tamanhos.trim(),
      cores: cores.trim(),
    };

    const resultado = produtoEditando
      ? await supabase
          .from("products")
          .update(dadosProduto)
          .eq("id", produtoEditando.id)
      : await supabase.from("products").insert(dadosProduto);

    if (resultado.error) {
      setFeedback({
        tipo: "erro",
        mensagem: "Não foi possível salvar o produto.",
      });
      setSalvando(false);
      return;
    }

    setFeedback({
      tipo: "sucesso",
      mensagem: produtoEditando
        ? "Produto atualizado com sucesso."
        : "Produto salvo com sucesso.",
    });
    limparFormulario();
    await carregarProdutos();
    setSalvando(false);
  }

  async function sair() {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  }

  useEffect(() => {
    let ativo = true;

    async function verificarLogin() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!ativo) return;

      if (!session) {
        navigate("/login", { replace: true });
        return;
      }

      setCarregandoPagina(false);
      await carregarProdutos();
    }

    verificarLogin();

    return () => {
      ativo = false;
    };
  }, [carregarProdutos, navigate]);

  if (carregandoPagina) {
    return (
      <main className="min-h-screen grid place-items-center">
        <p className="text-gray-600">Verificando acesso...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-8 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-[#8a5d2b]">
            Selleta Modas
          </p>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Painel Administrativo
          </h1>
        </div>

        <button
          onClick={sair}
          className="rounded-lg border border-red-200 px-4 py-2 font-semibold text-red-700 transition hover:bg-red-50"
        >
          Sair
        </button>
      </header>

      {feedback && (
        <div
          role="status"
          className={`mb-6 rounded-lg p-3 text-sm ${
            feedback.tipo === "erro"
              ? "bg-red-50 text-red-700"
              : "bg-green-50 text-green-700"
          }`}
        >
          {feedback.mensagem}
        </div>
      )}

      <section className="grid gap-8 lg:grid-cols-[minmax(0,420px)_1fr]">
        <form
          onSubmit={salvarProduto}
          className="h-fit rounded-2xl border border-[#C58B39]/20 bg-white p-5 shadow-sm sm:p-6"
        >
          <h2 className="mb-5 text-xl font-bold">
            {produtoEditando ? "Editar produto" : "Novo produto"}
          </h2>

          <div className="flex flex-col gap-4">
            <label>
              <span className="mb-1 block text-sm font-medium">Nome</span>
              <input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Nome do produto"
                maxLength={100}
                required
                className={campoClasse}
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">Categoria</span>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                required
                className={campoClasse}
              >
                <option value="">Selecione</option>
                <option>Vestido</option>
                <option>Short</option>
                <option>Saia</option>
                <option>Blusa</option>
              </select>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label>
                <span className="mb-1 block text-sm font-medium">Preço</span>
                <input
                  value={preco}
                  onChange={(e) => setPreco(e.target.value)}
                  placeholder="99,90"
                  inputMode="decimal"
                  required
                  className={campoClasse}
                />
              </label>

              <label>
                <span className="mb-1 block text-sm font-medium">Estoque</span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={estoque}
                  onChange={(e) => setEstoque(e.target.value)}
                  placeholder="0"
                  required
                  className={campoClasse}
                />
              </label>
            </div>

            <label>
              <span className="mb-1 block text-sm font-medium">Descrição</span>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Detalhes da peça"
                maxLength={500}
                rows={3}
                className={campoClasse}
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">Tamanhos</span>
              <input
                value={tamanhos}
                onChange={(e) => setTamanhos(e.target.value)}
                placeholder="P,M,G,GG"
                className={campoClasse}
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">Cores</span>
              <input
                value={cores}
                onChange={(e) => setCores(e.target.value)}
                placeholder="Preto,Azul,Rosa"
                className={campoClasse}
              />
            </label>

            <label>
              <span className="mb-1 block text-sm font-medium">Imagem</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(e) => setImagem(e.target.files?.[0] || null)}
                className={campoClasse}
              />
              <span className="mt-1 block text-xs text-gray-500">
                PNG, JPG ou WebP de até 5 MB.
              </span>
            </label>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={salvando}
                className="flex-1 rounded-lg bg-[#8a5d2b] p-3 font-semibold text-white transition hover:bg-[#70491f]"
              >
                {salvando
                  ? "Salvando..."
                  : produtoEditando
                    ? "Atualizar produto"
                    : "Salvar produto"}
              </button>

              {produtoEditando && (
                <button
                  type="button"
                  onClick={limparFormulario}
                  className="rounded-lg border px-4 py-3 font-semibold"
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </form>

        <div>
          <h2 className="mb-4 text-2xl font-bold">Produtos cadastrados</h2>

          {produtos.length === 0 ? (
            <div className="rounded-2xl border border-dashed bg-white p-8 text-center text-gray-500">
              Nenhum produto cadastrado ainda.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {produtos.map((produto) => (
                <article
                  key={produto.id}
                  className="overflow-hidden rounded-2xl border bg-white shadow-sm"
                >
                  {produto.imagem && (
                    <img
                      src={produto.imagem}
                      alt={produto.products}
                      loading="lazy"
                      className="aspect-square w-full object-cover"
                    />
                  )}

                  <div className="p-4">
                    <h3 className="font-bold">{produto.products}</h3>
                    <p className="text-sm text-gray-500">
                      {produto.categoria || "Sem categoria"}
                    </p>
                    <p className="mt-2 font-semibold text-[#8a5d2b]">
                      {formatarPreco(produto.preco)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Estoque: {produto.estoque}
                    </p>

                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => editarProduto(produto)}
                        className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => setProdutoParaExcluir(produto)}
                        className="flex-1 rounded-lg bg-red-600 px-3 py-2 text-sm font-semibold text-white"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {produtoParaExcluir && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="titulo-exclusao"
        >
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="titulo-exclusao" className="text-xl font-bold">
              Excluir produto?
            </h2>
            <p className="mt-2 text-gray-600">
              “{produtoParaExcluir.products}” será removido do catálogo.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setProdutoParaExcluir(null)}
                className="rounded-lg border px-4 py-2 font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarExclusao}
                className="rounded-lg bg-red-600 px-4 py-2 font-semibold text-white"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
