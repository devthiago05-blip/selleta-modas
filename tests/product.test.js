import test from "node:test";
import assert from "node:assert/strict";
import {
  obterCoresProduto,
  obterEstampasProduto,
  obterOpcoes,
  obterPrecoVenda,
  obterTamanhosProduto,
  obterVariacaoSelecionada,
  temPrecoPromocional,
} from "../src/lib/product.js";

test("normaliza opções separadas por vírgula", () => {
  assert.deepEqual(obterOpcoes(" P, M, ,G "), ["P", "M", "G"]);
  assert.deepEqual(obterOpcoes(null), []);
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
