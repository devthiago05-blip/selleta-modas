import test from "node:test";
import assert from "node:assert/strict";
import { analisarPlanilhaProdutos, COLUNAS_IMPORTACAO } from "../src/lib/product-import.js";

const cabecalho = COLUNAS_IMPORTACAO.map((coluna) => coluna.titulo);

test("converte uma linha da planilha em produto com grade P/M/G/GG", () => {
  const { produtos, erros } = analisarPlanilhaProdutos([
    cabecalho,
    ["Vestido Teste", 159.9, 1, 2, 3, 4, "Preto", "Vestido", 139.9, "Sem estampa", "https://exemplo.com/produto.jpg", "", "Descrição", "VES-001", "Sim"],
  ]);

  assert.deepEqual(erros, []);
  assert.equal(produtos.length, 1);
  assert.equal(produtos[0].dados.estoque, 10);
  assert.deepEqual(produtos[0].variantes.map((item) => item.size), ["P", "M", "G", "GG"]);
});

test("bloqueia produto repetido e imagem ausente", () => {
  const { produtos, erros } = analisarPlanilhaProdutos([
    cabecalho,
    ["Vestido Teste", 159.9, 1, 0, 0, 0, "Preto", "Vestido", "", "Sem estampa", "", "", "", "", "Sim"],
  ], ["Vestido Teste"]);

  assert.equal(produtos.length, 0);
  assert.ok(erros.some((erro) => erro.includes("imagem HTTPS")));
  assert.ok(erros.some((erro) => erro.includes("já está cadastrado")));
});

