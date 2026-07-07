import assert from "node:assert/strict";
import test from "node:test";
import {
  ALTURA_IMAGEM_PRODUTO,
  calcularEncaixeImagem,
  LARGURA_IMAGEM_PRODUTO,
  validarImagemProduto,
} from "../src/lib/product-image.js";

test("aceita apenas imagens permitidas de até 5 MB", () => {
  assert.equal(
    validarImagemProduto({ type: "image/jpeg", size: 1024 }),
    null
  );
  assert.match(
    validarImagemProduto({ type: "image/svg+xml", size: 1024 }),
    /JPEG, PNG ou WebP/
  );
  assert.match(
    validarImagemProduto({ type: "image/png", size: 6 * 1024 * 1024 }),
    /5 MB/
  );
});

test("encaixa fotos verticais e horizontais sem cortar", () => {
  for (const [largura, altura] of [
    [800, 1600],
    [1600, 800],
  ]) {
    const encaixe = calcularEncaixeImagem(largura, altura);
    assert.ok(encaixe.largura <= LARGURA_IMAGEM_PRODUTO - 96);
    assert.ok(encaixe.altura <= ALTURA_IMAGEM_PRODUTO - 96);
    assert.equal(
      Math.round((encaixe.largura / encaixe.altura) * 100),
      Math.round((largura / altura) * 100)
    );
  }
});
