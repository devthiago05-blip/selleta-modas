
import logoSelleta from "../assets/logo-selleta.png";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Loja() {
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [carrinhoAberto, setCarrinhoAberto] =
  useState(false);
  const [tamanhoSelecionado, setTamanhoSelecionado] = useState({});
  const [corSelecionada, setCorSelecionada] = useState({});
  const [quantidadeSelecionada, setQuantidadeSelecionada] = useState({});
  const [nomeCliente, setNomeCliente] = useState("");
  const [telefoneCliente, setTelefoneCliente] = useState("");
  const [enderecoCliente, setEnderecoCliente] = useState("");
  const [observacoesCliente, setObservacoesCliente] = useState("");
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

  

  async function carregarProdutos() {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("nome");

    if (error) {
      console.log(error);
      return;
    }

    setProdutos(data);
  }

  function adicionarAoCarrinho(produto) {

  if (!tamanhoSelecionado[produto.id]) {
    alert("Selecione um tamanho");
    return;
  }

  if (!corSelecionada[produto.id]) {
    alert("Selecione uma cor");
    return;
  }

  if (
  (quantidadeSelecionada[produto.id] || 1) >
  produto.estoque
) {
  alert("Quantidade maior que o estoque disponível");
  return;
}

  const itemCarrinho = {
    ...produto,
    tamanho: tamanhoSelecionado[produto.id],
    cor: corSelecionada[produto.id],
    quantidade:
      quantidadeSelecionada[produto.id] || 1,
  };

  setCarrinho((itens) => {

  const itemExistente = itens.find(
    (item) =>
      item.id === itemCarrinho.id &&
      item.tamanho === itemCarrinho.tamanho &&
      item.cor === itemCarrinho.cor
  );

  if (itemExistente) {
    return itens.map((item) => {

      if (
        item.id === itemCarrinho.id &&
        item.tamanho === itemCarrinho.tamanho &&
        item.cor === itemCarrinho.cor
      ) {

        const novaQuantidade =
          item.quantidade +
          itemCarrinho.quantidade;

        if (novaQuantidade > produto.estoque) {
          alert(
            "Quantidade ultrapassa o estoque disponível"
          );
          return item;
        }

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
            quantidade: novaQuantidade,
          }
        : item
    )
  );
}
function finalizarPedido() {
  if (!nomeCliente) {
  alert("Informe seu nome");
  return;
}

if (!telefoneCliente) {
  alert("Informe seu telefone");
  return;
}
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio");
    return;
  }

  let mensagem =
    "Olá! Gostaria de fazer o seguinte pedido:%0A%0A";

  carrinho.forEach((item) => {
    mensagem +=
      `• ${item.nome}%0A` +
      `Tam: ${item.tamanho}%0A` +
      `Cor: ${item.cor}%0A` +
      `Qtd: ${item.quantidade}%0A` +
      `Valor: R$ ${(item.preco * item.quantidade).toFixed(2)}%0A%0A`;
  });

  mensagem +=
  `Total: R$ ${total.toFixed(2)}%0A%0A` +

  `Nome: ${nomeCliente}%0A` +

  `Telefone: ${telefoneCliente}%0A` +

  `Endereço: ${enderecoCliente}%0A` +

  `Observações: ${observacoesCliente}`;

  const numero =
    "5585987433260"; // TROCAR PELO SEU NÚMERO

  window.open(
    `https://wa.me/${numero}?text=${mensagem}`,
    "_blank"
  );
}

  useEffect(() => {
    carregarProdutos();
  }, []);
  const quantidadeCarrinho = carrinho.reduce(
  (soma, item) =>
    soma + item.quantidade,
  0
);
  const total = carrinho.reduce(
  (soma, item) =>
    soma + Number(item.preco) * item.quantidade,
  0
);

  return (
    <div className="max-w-7xl mx-auto p-10">
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
  className="
    fixed
    top-0
    right-0
    h-full
    w-96
    bg-white
    shadow-2xl
    p-4
    overflow-y-auto
    z-50
  "
>
  <div className="flex justify-between items-center mb-4">

  <h2 className="text-xl font-bold">
    Resumo do Pedido
  </h2>

  <button
    onClick={() => setCarrinhoAberto(false)}
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

  {carrinho.map((item, index) => (
    <div
  key={index}
  className="flex justify-between items-center py-2"
>
  <div>
   <div>
  <div>{item.nome}</div>

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
    className="px-2 border rounded"
  >
    +
  </button>

</div>
</div>
<div>
  R$ {(item.preco * item.quantidade).toFixed(2)}
</div>
  </div>

  <button
    onClick={() => removerDoCarrinho(index)}
    className="bg-red-500 text-white px-2 py-1 rounded"
  >
    ❌
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
  Total: R$ {total.toFixed(2)}
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
  <div className="text-center mb-10">
<div className="fixed top-6 right-6 z-50">

  <button
    onClick={() =>
      setCarrinhoAberto(!carrinhoAberto)
    }
    className="
      relative
      bg-white
      shadow-lg
      rounded-full
      w-14
      h-14
      flex
      items-center
      justify-center
      text-2xl
    "
  >
    <svg
  xmlns="http://www.w3.org/2000/svg"
  fill="none"
  viewBox="0 0 24 24"
  strokeWidth={2}
  stroke="currentColor"
  className="w-7 h-7"
>
  <path
    strokeLinecap="round"
    strokeLinejoin="round"
    d="M2.25 3h1.386a1.5 1.5 0 011.415 1.026L5.76 6.75m0 0h13.74l-1.125 6.75H7.125m-1.365-6.75L7.125 13.5m0 0a2.25 2.25 0 104.5 0m-4.5 0a2.25 2.25 0 104.5 0m4.5 0a2.25 2.25 0 104.5 0"
  />
</svg>

    {carrinho.length > 0 && (
      <span
        className="
          absolute
          -top-2
          -right-2
          bg-red-500
          text-white
          text-xs
          font-bold
          rounded-full
          w-6
          h-6
          flex
          items-center
          justify-center
        "
      >
        {quantidadeCarrinho}
      </span>
    )}

  </button>

</div>
  <img
    src={logoSelleta}
    alt="Selleta Modas"
    className="mx-auto w-56 mb-4"
  />
<div className="bg-[#C58B39] text-white rounded-2xl p-8 text-center mb-10">
  <h2 className="text-3xl font-bold">
    Elegância e estilo para todas as ocasiões
  </h2>

  <p className="mt-2">
    Confira nossas novidades e tendências
  </p>
</div>
  <h1 className="text-4xl font-bold">
    Selleta Modas
  </h1>

  <p className="text-gray-500 mt-2">
    Moda feminina para todos os estilos
  </p>

</div>
</div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {produtos.map((produto) => (
          <div
            key={produto.id}
            className="border rounded-xl p-4 shadow-lg bg-white hover:shadow-xl transition duration-300"
          >
            {produto.imagem && (
              <img
  src={produto.imagem}
  alt={produto.nome}
  className="w-full aspect-square object-cover rounded-xl border"
/>

            )}

            <h2 className="text-xl font-bold mt-4">
              {produto.nome}
            </h2>
            <p className="text-gray-600 mt-2">
              {produto.descricao}
              </p>
              {produto.tamanhos && (
  <div className="mt-3">
    <p className="font-semibold mb-2">
      Tamanho
    </p>

    <div className="flex gap-2">
      {produto.tamanhos
        .split(",")
        .map((tam) => (
          <button
            key={tam}
            onClick={() =>
              setTamanhoSelecionado({
                ...tamanhoSelecionado,
                [produto.id]: tam,
              })
            }
            className={`px-3 py-1 border rounded ${
              tamanhoSelecionado[produto.id] === tam
                ? "bg-[#C58B39] text-white"
                : ""
            }`}
          >
            {tam}
          </button>
        ))}
    </div>
  </div>
)}

      
      

{produto.cores && (
  <div className="mt-3">
    <p className="font-semibold mb-2">
      Cor
    </p>

    <div className="flex gap-2">
      {produto.cores
        .split(",")
        .map((cor) => {
          const corLimpa = cor.trim().toLowerCase();

          return (
            <button
              key={cor}
              onClick={() =>
                setCorSelecionada({
                  ...corSelecionada,
                  [produto.id]: cor.trim(),
                })
              }
              className={`w-8 h-8 rounded-full border-2 ${
                corSelecionada[produto.id] === cor.trim()
                  ? "border-pink-500 scale-110"
                  : "border-gray-300"
              }`}
              style={{
                backgroundColor:
                  mapaCores[corLimpa] || "#cccccc",
              }}
              title={cor}
            />
          );
        })}
    </div>
  </div>
)}
<div className="mt-3">
  <p className="font-semibold mb-2">
    Quantidade
  </p>

  <div className="flex items-center gap-2">

    <button
      onClick={() =>
        setQuantidadeSelecionada({
          ...quantidadeSelecionada,
          [produto.id]: Math.max(
            1,
            (quantidadeSelecionada[produto.id] || 1) - 1
          ),
        })
      }
      className="px-3 py-1 border rounded"
    >
      -
    </button>

    <span className="font-bold">
      {quantidadeSelecionada[produto.id] || 1}
    </span>

    <button
      onClick={() =>
        setQuantidadeSelecionada({
          ...quantidadeSelecionada,
          [produto.id]: Math.min(
            produto.estoque,
            (quantidadeSelecionada[produto.id] || 1) + 1
          ),
        })
      }
      className="px-3 py-1 border rounded"
    >
      +
    </button>

  </div>

  <p className="text-sm text-gray-500 mt-1">
    Estoque disponível: {produto.estoque}
  </p>
</div>
            <p className="text-[#C58B39] font-bold text-lg">
              R$ {produto.preco}
            </p>

            <button
  onClick={() => adicionarAoCarrinho(produto)}
  className="mt-4 w-full bg-[#C58B39] text-white p-3 rounded"
>
  Adicionar ao Carrinho
</button>
          </div>
        ))}
      </div>
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
    </div>
  );
}