export const SITE_URL = String(
  import.meta.env.VITE_SITE_URL || "https://selleta-modas.vercel.app"
).replace(/\/+$/, "");

export function criarUrlAbsoluta(caminho = "") {
  const valor = String(caminho || "").trim();

  if (!valor) return SITE_URL;
  if (/^https?:\/\//i.test(valor)) return valor;

  return `${SITE_URL}${valor.startsWith("/") ? valor : `/${valor}`}`;
}

export function textoMeta(valor, limite = 155) {
  return String(valor || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, limite);
}
