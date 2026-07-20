import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  metodoPagamentoLabels,
  pagamentoLabels,
  pedidoLabels,
} from "../src/lib/order-status.js";
import {
  criarMensagemWhatsAppPedido,
  normalizarTelefone,
  pagamentoPixPendente,
  pedidoPodeAvancarComPagamento,
} from "../src/lib/order-ui.js";

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
  assert.match(grade, /print_image_url/);
  assert.match(grade, /private\.is_admin/);
});

test("balanço de estoque exige administrador e mantém histórico", async () => {
  const balanco = await readFile(
    new URL("../supabase/inventory-balance.sql", import.meta.url),
    "utf8"
  );

  assert.match(balanco, /create table if not exists public\.inventory_adjustments/);
  assert.match(balanco, /enable row level security/);
  assert.match(balanco, /public\.admin_balance_product_stock/);
  assert.match(balanco, /private\.is_admin/);
  assert.match(balanco, /array\['P', 'M', 'G', 'GG'\]/);
});

test("regras comerciais de pedido protegem Pix e WhatsApp", () => {
  const pedido = {
    order_number: 12,
    payment_method: "pix",
    payment_status: "pending",
    order_status: "confirmed",
  };

  assert.equal(pagamentoPixPendente(pedido), true);
  assert.equal(pedidoPodeAvancarComPagamento(pedido), false);
  assert.match(criarMensagemWhatsAppPedido(pedido, "admin"), /#12/);
  assert.equal(normalizarTelefone("(85) 99999-0000"), "5585999990000");
});
