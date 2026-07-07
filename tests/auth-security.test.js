import assert from "node:assert/strict";
import test from "node:test";
import {
  consultarBloqueioLogin,
  JANELA_BLOQUEIO_LOGIN_MS,
  registrarFalhaLogin,
} from "../src/lib/auth-security.js";

function criarStorage() {
  const dados = new Map();
  return {
    getItem: (chave) => dados.get(chave) || null,
    setItem: (chave, valor) => dados.set(chave, valor),
    removeItem: (chave) => dados.delete(chave),
  };
}

test("bloqueia o login após cinco falhas", () => {
  const storage = criarStorage();
  const agora = 1_000_000;

  for (let tentativa = 1; tentativa <= 5; tentativa += 1) {
    registrarFalhaLogin(storage, agora);
  }

  const estado = consultarBloqueioLogin(storage, agora);
  assert.equal(estado.bloqueado, true);
  assert.equal(estado.tentativasRestantes, 0);
  assert.equal(estado.minutosRestantes, 15);
});

test("libera novas tentativas após quinze minutos", () => {
  const storage = criarStorage();
  const agora = 1_000_000;

  for (let tentativa = 1; tentativa <= 5; tentativa += 1) {
    registrarFalhaLogin(storage, agora);
  }

  const estado = consultarBloqueioLogin(
    storage,
    agora + JANELA_BLOQUEIO_LOGIN_MS + 1
  );
  assert.equal(estado.bloqueado, false);
  assert.equal(estado.tentativasRestantes, 5);
});
