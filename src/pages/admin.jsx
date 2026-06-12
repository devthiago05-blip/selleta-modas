import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Admin() {
  // ===== ESTADOS DO FORMULÁRIO =====
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [estoque, setEstoque] = useState("");
  const [imagem, setImagem] = useState(null);
  const [descricao, setDescricao] = useState("");
  const [tamanhos, setTamanhos] = useState("");
  const [cores, setCores] = useState("");
  const navigate = useNavigate();
  

  // ===== LISTA DE PRODUTOS =====
  const [produtos, setProdutos] = useState([]);

  const [produtoEditando, setProdutoEditando] = useState(null);

  // ===== CARREGAR PRODUTOS =====
  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("products");

    if (error) {
      console.log("Erro ao buscar produtos:", error);
      return;
    }

    setProdutos(data);
  }

  // ===== EXCLUIR PRODUTO =====
async function deletarProduto(id) {
const confirmar = window.confirm(
"Tem certeza que deseja excluir este produto?"
);

if (!confirmar) return;

const { error } = await supabase
  .from("products")
  .delete()
  .eq("id", id);

if (error) {
  console.log(error);
  alert(error.message);
  return;
}

alert("Produto excluído com sucesso!");

carregarProdutos();

}

async function editarProduto(produto) {
  setProdutoEditando(produto);

  setNome(produto.nome);
  setCategoria(produto.categoria);
  setPreco(produto.preco.toString());
  setEstoque(produto.estoque.toString());
  setDescricao(produto.descricao || "");
  setTamanhos(produto.tamanhos || "");
  setCores(produto.cores || "");
}
  // ===== SALVAR PRODUTO =====
  async function salvarProduto() {
    const precoFormatado = Number(
      preco.replace(",", ".")
    );

    if (!nome || !categoria || !preco || !estoque) {
      alert("Preencha todos os campos");
      return;
    }

let imagemUrl = produtoEditando?.imagem || null;

if (imagem) {
  console.log("Imagem selecionada:", imagem);

  const nomeArquivo =
    Date.now() + "-" + imagem.name;

  console.log("Nome arquivo:", nomeArquivo);

  const { error: uploadError } =
    await supabase.storage
      .from("produtos")
      .upload(nomeArquivo, imagem);

  if (uploadError) {
    console.log(uploadError);
    alert(uploadError.message);
    return;
  }

  const { data } = supabase.storage
    .from("produtos")
    .getPublicUrl(nomeArquivo);

  imagemUrl = data.publicUrl;

  console.log("URL gerada:", imagemUrl);
}

    let error;

if (produtoEditando) {
  const resultado = await supabase
    .from("products")
    .update({
      nome,
      categoria,
      preco: precoFormatado,
      estoque: Number(estoque),
      imagem: imagemUrl,
      descricao,
      tamanhos,
      cores,
    })
    .eq("id", produtoEditando.id);

  error = resultado.error;

} else {
  const resultado = await supabase
    .from("products")
    .insert({
  nome,
  categoria,
  preco: precoFormatado,
  estoque: Number(estoque),
  imagem: imagemUrl,
  descricao,
  tamanhos,
  cores,
});

  error = resultado.error;
};

    if (error) {
      console.log(error);
      alert(error.message);
      return;
    }

    alert(
  produtoEditando
    ? "Produto atualizado com sucesso!"
    : "Produto salvo com sucesso!"
);


    // atualizar lista
    carregarProdutos();

    // limpar campos
    setNome("");
    setCategoria("");
    setPreco("");
    setProdutoEditando(null);
    setEstoque("");
    setImagem(null);
    setDescricao("");
    setTamanhos("");
    setCores("");
  }
  async function sair() {
  await supabase.auth.signOut();

  navigate("/login");
}
  // ===== CARREGA AO ABRIR A PÁGINA =====
  useEffect(() => {

  async function verificarLogin() {

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      navigate("/login");
      return;
    }

    carregarProdutos();
  }

  verificarLogin();

}, []);

    async function sair() {

  await supabase.auth.signOut();

  navigate("/login");
}
  return (
    <div className="p-10">

      <div className="flex justify-between items-center mb-6">

  <div className="flex justify-between items-center mb-6">

  <h1 className="text-3xl font-bold">
    Painel Administrativo
  </h1>

  <button
    onClick={sair}
    className="bg-red-500 text-white px-4 py-2 rounded"
  >
    Sair
  </button>

</div>

  <button
    onClick={sair}
    className="bg-red-500 text-white px-4 py-2 rounded"
  >
    Sair
  </button>

</div>

      {/* FORMULÁRIO */}
      <div className="flex flex-col gap-3 max-w-md">

        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Nome do Produto"
          className="border p-2"
        />

        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="border p-2"
        >
          <option value="">Selecione</option>
          <option>Vestido</option>
          <option>Short</option>
          <option>Saia</option>
          <option>Blusa</option>
        </select>

        <input
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          placeholder="Preço"
          className="border p-2"
        />

        <input
          value={estoque}
          onChange={(e) => setEstoque(e.target.value)}
          placeholder="Estoque"
          className="border p-2"
        />

        <input
  value={descricao}
  onChange={(e) => setDescricao(e.target.value)}
  placeholder="Descrição"
  className="border p-2"
/>

<input
  value={tamanhos}
  onChange={(e) => setTamanhos(e.target.value)}
  placeholder="Tamanhos (P,M,G,GG)"
  className="border p-2"
/>

<input
  value={cores}
  onChange={(e) => setCores(e.target.value)}
  placeholder="Cores (Preto,Azul,Rosa)"
  className="border p-2"
/>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
  console.log("ARQUIVO SELECIONADO:", e.target.files[0]);
  setImagem(e.target.files[0]);
}}
          className="border p-2"
/>

        <button
          onClick={salvarProduto}
          className="bg-pink-500 text-white p-3 rounded"
        >
          {produtoEditando
  ? "Atualizar Produto"
  : "Salvar Produto"}
        </button>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">
          Produtos Cadastrados
        </h2>

        {produtos.length === 0 ? (
          <p>Nenhum produto cadastrado ainda.</p>
        ) : (
          produtos.map((produto) => (
            <div
              key={produto.id}
              className="border p-4 mb-3 rounded"
            >
              {produto.imagem && (
  <img
    src={produto.imagem}
    alt={produto.nome}
    className="w-40 h-40 object-cover rounded mb-3"
  />
)}
              <h3 className="font-bold">
                {produto.nome}
              </h3>

              <p>Categoria: {produto.categoria}</p>
<p>Preço: R$ {produto.preco}</p>
<p>Estoque: {produto.estoque}</p>

<button
  onClick={() => editarProduto(produto)}
  className="mt-3 mr-2 bg-blue-500 text-white px-4 py-2 rounded"
>
  Editar
</button>

<button
  onClick={() => deletarProduto(produto.id)}
  className="mt-3 bg-red-500 text-white px-4 py-2 rounded"
>
  Excluir
</button>
            </div>
          ))
        )}
      </div>

    </div>
  );
}