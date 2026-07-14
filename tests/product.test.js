import test from "node:test";
import assert from "node:assert/strict";
import {
  obterCoresProduto,
  obterEstampasProduto,
  obterImagemPrincipal,
  obterImagensProduto,
  obterOpcoesDisponiveisProduto,
  obterOpcoes,
  obterPrecoVenda,
  obterTamanhosProduto,
  obterVariacaoSelecionada,
  temPrecoPromocional,
} from "../src/lib/product.js";
import {
  CORES_COMUNS,
  completarGradePadrao,
  gerarCombinacoesGrade,
  TAMANHOS_PADRAO,
} from "../src/lib/variants.js";

test("normaliza opções separadas por vírgula", () => {
  assert.deepEqual(obterOpcoes(" P, M, ,G "), ["P", "M", "G"]);
  assert.deepEqual(obterOpcoes(null), []);
});

test("normaliza galeria mantendo imagem principal", () => {
  const produto = {
    imagem: "/products/principal.webp",
    imagens: ["/products/principal.webp", "/products/detalhe.webp"],
  };

  assert.deepEqual(obterImagensProduto(produto), [
    "/products/principal.webp",
    "/products/detalhe.webp",
  ]);
  assert.equal(obterImagemPrincipal(produto), "/products/principal.webp");
});

test("usa preço promocional válido", () => {
  const produto = { preco: 100, preco_promocional: 79.9 };

  assert.equal(temPrecoPromocional(produto), true);
  assert.equal(obterPrecoVenda(produto), 79.9);
});

test("ignora promoção inválida", () => {
  assert.equal(
    obterPrecoVenda({ preco: 100, preco_promocional: 120 }),
    100
  );
  assert.equal(
    obterPrecoVenda({ preco: 100, preco_promocional: null }),
    100
  );
});

test("usa grade estruturada quando existem variações", () => {
  const produto = {
    tamanhos: "Único",
    cores: "Padrão",
    product_variants: [
      { id: "1", size: "P", color: "Preto", print: "Floral", active: true },
      { id: "2", size: "M", color: "Rosa", print: "Liso", active: true },
      { id: "3", size: "G", color: "Azul", print: "Poá", active: false },
    ],
  };

  assert.deepEqual(obterTamanhosProduto(produto), ["P", "M"]);
  assert.deepEqual(obterCoresProduto(produto), ["Preto", "Rosa"]);
  assert.deepEqual(obterEstampasProduto(produto), ["Floral", "Liso"]);
  assert.equal(
    obterVariacaoSelecionada(produto, "P", "Preto", "Floral")?.id,
    "1"
  );
});

test("oferece grade padrão e 30 cores comuns", () => {
  assert.deepEqual(TAMANHOS_PADRAO, ["P", "M", "G", "GG"]);
  assert.equal(CORES_COMUNS.length, 30);
});

test("gera combinações de tamanho, cor e estampa", () => {
  const grade = gerarCombinacoesGrade({
    tamanhos: ["P", "M"],
    cores: ["Preto", "Rosa"],
    estampas: [{ nome: "Floral", imagemUrl: "https://exemplo.com/floral.jpg" }],
    estoqueInicial: 2,
  });

  assert.equal(grade.length, 4);
  assert.equal(grade[0].stock, "2");
  assert.equal(grade[0].print, "Floral");
  assert.equal(grade[0].print_image_url, "https://exemplo.com/floral.jpg");
});

test("completa P, M, G e GG sem perder estoque existente", () => {
  const grade = completarGradePadrao([
    { id: "1", size: "M", color: "Vermelho", print: "Sem estampa", stock: 3 },
  ]);

  assert.deepEqual(
    grade.map((variacao) => variacao.size).sort(),
    ["G", "GG", "M", "P"]
  );
  assert.equal(grade.find((variacao) => variacao.size === "M").stock, 3);
  assert.equal(grade.find((variacao) => variacao.size === "P").stock, 0);
});

test("seleciona primeira combinacao com estoque para compra rapida", () => {
  const produto = {
    estoque: 0,
    product_variants: [
      {
        id: "1",
        size: "P",
        color: "Preto",
        print: "Sem estampa",
        stock: 0,
        active: true,
      },
      {
        id: "2",
        size: "M",
        color: "Rosa",
        print: "Sem estampa",
        stock: 3,
        active: true,
      },
    ],
  };

  const opcoes = obterOpcoesDisponiveisProduto(produto);

  assert.equal(opcoes.tamanho, "M");
  assert.equal(opcoes.cor, "Rosa");
  assert.equal(opcoes.variacao.id, "2");
  assert.equal(opcoes.estoque, 3);
});
