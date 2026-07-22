import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("página principal publica metadados essenciais", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="pt-BR">/);
  assert.match(html, /rel="canonical" href="https:\/\/selleta-modas\.vercel\.app\/"/);
  assert.match(html, /rel="manifest" href="\/site\.webmanifest"/);
  assert.match(html, /property="og:site_name" content="Selleta Modas"/);
  assert.match(html, /Moda feminina online/);
  assert.match(html, /property="og:image" content="https:\/\/selleta-modas\.vercel\.app\/og-selleta\.svg"/);
  assert.match(html, /"@graph"/);
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

test("gerador de sitemap também publica robots com domínio configurável", async () => {
  const script = await readFile(
    new URL("../scripts/generate-sitemap.mjs", import.meta.url),
    "utf8"
  );
  const env = await readFile(new URL("../.env.example", import.meta.url), "utf8");

  assert.match(script, /VITE_SITE_URL/);
  assert.match(script, /writeFile\("public\/robots\.txt"/);
  assert.match(env, /VITE_SITE_URL=https:\/\/selleta-modas\.vercel\.app/);
});

test("página de produto prepara dados estruturados de produto", async () => {
  const paginaProduto = await readFile(
    new URL("../src/pages/product-detail.jsx", import.meta.url),
    "utf8"
  );

  assert.match(paginaProduto, /selleta-single-product-schema/);
  assert.match(paginaProduto, /criarUrlAbsoluta\(obterUrlProduto\(produto\)\)/);
  assert.match(paginaProduto, /"@type": "Product"/);
  assert.match(paginaProduto, /priceCurrency/);
  assert.match(paginaProduto, /availability/);
});
