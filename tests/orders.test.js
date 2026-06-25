import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  metodoPagamentoLabels,
  pagamentoLabels,
  pedidoLabels,
} from "../src/lib/order-status.js";

test("migrações de pedidos usam UUID para produtos", async () => {
  const instalacao = await readFile(
    new URL("../supabase/orders.sql", import.meta.url),
    "utf8"
  );
  const correcao = await readFile(
    new URL("../supabase/orders-uuid-client-fix.sql", import.meta.url),
    "utf8"
  );

  assert.match(instalacao, /product_id uuid not null/);
  assert.match(instalacao, /product_id'\)::uuid/);
  assert.doesNotMatch(instalacao, /product_id'\)::bigint/);
  assert.match(correcao, /alter column product_id type uuid/);
});

test("todos os estados comerciais possuem rótulos", () => {
  assert.deepEqual(Object.keys(pagamentoLabels), [
    "pending",
    "paid",
    "pay_on_delivery",
    "failed",
    "refunded",
  ]);

  assert.deepEqual(Object.keys(pedidoLabels), [
    "received",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "delivered",
    "canceled",
  ]);

  assert.deepEqual(Object.keys(metodoPagamentoLabels), [
    "pix",
    "cash_on_delivery",
    "card_on_delivery",
  ]);
});

test("migração de grade vincula a variação ao pedido", async () => {
  const grade = await readFile(
    new URL("../supabase/product-variants.sql", import.meta.url),
    "utf8"
  );

  assert.match(grade, /create table if not exists public\.product_variants/);
  assert.match(grade, /add column if not exists variant_id uuid/);
  assert.match(grade, /v_item->>'variant_id'/);
  assert.match(grade, /private\.is_admin/);
});
