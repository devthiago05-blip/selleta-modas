import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("página principal publica metadados essenciais", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /rel="canonical" href="https:\/\/selleta-modas\.vercel\.app\/"/);
  assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
  assert.match(html, /property="og:site_name" content="Selleta Modas"/);
});

test("robots informa o sitemap público", async () => {
  const robots = await readFile(
    new URL("../public/robots.txt", import.meta.url),
    "utf8"
  );
  const sitemap = await readFile(
    new URL("../public/sitemap.xml", import.meta.url),
    "utf8"
  );

  assert.match(
    robots,
    /Sitemap: https:\/\/selleta-modas\.vercel\.app\/sitemap\.xml/
  );
  assert.match(sitemap, /<loc>https:\/\/selleta-modas\.vercel\.app\/<\/loc>/);
  assert.doesNotMatch(sitemap, /\/admin|\/login|\/cliente|\/pedido/);
});

test("página de produto prepara dados estruturados de produto", async () => {
  const paginaProduto = await readFile(
    new URL("../src/pages/product-detail.jsx", import.meta.url),
    "utf8"
  );

  assert.match(paginaProduto, /selleta-single-product-schema/);
  assert.match(paginaProduto, /"@type": "Product"/);
  assert.match(paginaProduto, /priceCurrency/);
  assert.match(paginaProduto, /availability/);
});
