import { mkdir, readFile, writeFile } from "node:fs/promises";
import { gerarSlugProduto } from "../src/lib/product.js";

async function carregarEnvLocal() {
  try {
    const conteudo = await readFile(".env", "utf8");

    for (const linha of conteudo.split(/\r?\n/)) {
      if (!linha.trim() || linha.trim().startsWith("#")) continue;

      const indice = linha.indexOf("=");
      if (indice === -1) continue;

      const chave = linha.slice(0, indice).trim();
      const valor = linha.slice(indice + 1).trim();
      if (chave && process.env[chave] === undefined) {
        process.env[chave] = valor;
      }
    }
  } catch {
    // Ambientes como Vercel já recebem variáveis pelo processo.
  }
}

await carregarEnvLocal();

const SITE_URL = process.env.VITE_SITE_URL || "https://selleta-modas.vercel.app";
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const hoje = new Date().toISOString().slice(0, 10);

function escaparXml(valor) {
  return String(valor)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function urlXml({ loc, changefreq, priority }) {
  return [
    "  <url>",
    `    <loc>${escaparXml(loc)}</loc>`,
    `    <lastmod>${hoje}</lastmod>`,
    `    <changefreq>${changefreq}</changefreq>`,
    `    <priority>${priority}</priority>`,
    "  </url>",
  ].join("\n");
}

function produtoPublicavel(produto) {
  const nome = String(produto?.products || "").trim();
  const nomeNormalizado = nome
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return nome && !nomeNormalizado.includes("teste");
}

async function carregarProdutosAtivos() {
  if (!supabaseUrl || !supabaseAnonKey) return [];

  const parametros = new URLSearchParams({
    select: "products,ativo",
    ativo: "eq.true",
    order: "products.asc",
  });

  try {
    const resposta = await fetch(
      `${supabaseUrl}/rest/v1/products?${parametros.toString()}`,
      {
        headers: {
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
      }
    );

    if (!resposta.ok) return [];

    return resposta.json();
  } catch {
    return [];
  }
}

const produtos = await carregarProdutosAtivos();
const slugs = [...new Set(produtos.filter(produtoPublicavel).map(gerarSlugProduto))];
const urls = [
  { loc: `${SITE_URL}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${SITE_URL}/politicas`, changefreq: "monthly", priority: "0.5" },
  ...slugs.map((slug) => ({
    loc: `${SITE_URL}/produto/${slug}`,
    changefreq: "weekly",
    priority: "0.8",
  })),
];

const sitemap = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  ...urls.map(urlXml),
  "</urlset>",
  "",
].join("\n");

await mkdir("public", { recursive: true });
await writeFile("public/sitemap.xml", sitemap, "utf8");
console.log(`Sitemap gerado com ${urls.length} URL(s).`);
