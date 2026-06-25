import test from "node:test";
import assert from "node:assert/strict";
import {
  obterOpcoes,
  obterPrecoVenda,
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
