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
import {
  CORES_COMUNS,
  gerarCombinacoesGrade,
  TAMANHOS_PADRAO,
} from "../src/lib/variants.js";

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
